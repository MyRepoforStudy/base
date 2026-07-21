import { Agent, fetch } from "undici";

const ZABBIX_API_URL = process.env.ZABBIX_API_URL ?? "";
const ZABBIX_API_TOKEN = process.env.ZABBIX_API_TOKEN ?? "";
const LINUX_HOST_GROUP = process.env.ZABBIX_LINUX_GROUP_NAME ?? "Linux servers";

// The bank's internal Zabbix uses a self-signed/internal CA certificate.
// TLS verification is disabled here per explicit instruction (same as `curl -k`).
// Revisit if/when the internal CA is trusted by the container's cert store.
const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

type JsonRpcResponse<T> = { result: T } | { error: { code: number; message: string; data: string } };

async function zabbixCall<T>(method: string, params: Record<string, unknown>): Promise<T> {
  if (!ZABBIX_API_URL || !ZABBIX_API_TOKEN) {
    throw new Error("ZABBIX_API_URL / ZABBIX_API_TOKEN is not configured");
  }

  const res = await fetch(ZABBIX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json-rpc",
      Authorization: `Bearer ${ZABBIX_API_TOKEN}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    dispatcher: insecureDispatcher,
  });

  const json = (await res.json()) as JsonRpcResponse<T>;
  if ("error" in json) {
    throw new Error(`Zabbix API error (${method}): ${json.error.message} - ${json.error.data}`);
  }
  return json.result;
}

export type ZabbixHost = {
  hostid: string;
  host: string;
  name: string;
  status: string;
  ip: string | null;
  cpuCount: number | null;
  cpuUtil: number | null;
  memTotalBytes: number | null;
  memAvailableBytes: number | null;
  os: string | null;
  uptimeSeconds: number | null;
};

const METRIC_KEYS = [
  "system.cpu.num",
  "system.cpu.util",
  "vm.memory.size[total]",
  "vm.memory.size[available]",
  "system.sw.os.get",
  "system.uptime",
];

export async function getLinuxHosts(): Promise<ZabbixHost[]> {
  const groups = await zabbixCall<{ groupid: string }[]>("hostgroup.get", {
    output: ["groupid"],
    filter: { name: [LINUX_HOST_GROUP] },
  });

  if (groups.length === 0) return [];
  const groupId = groups[0].groupid;

  const hosts = await zabbixCall<
    { hostid: string; host: string; name: string; status: string; interfaces: { ip: string }[] }[]
  >("host.get", {
    output: ["hostid", "host", "name", "status"],
    groupids: [groupId],
    selectInterfaces: ["ip"],
  });

  if (hosts.length === 0) return [];
  const hostIds = hosts.map((h) => h.hostid);

  const items = await zabbixCall<{ hostid: string; key_: string; lastvalue: string }[]>("item.get", {
    output: ["hostid", "key_", "lastvalue"],
    hostids: hostIds,
    filter: { key_: METRIC_KEYS },
  });

  const metricsByHost = new Map<string, Record<string, string>>();
  for (const item of items) {
    const entry = metricsByHost.get(item.hostid) ?? {};
    entry[item.key_] = item.lastvalue;
    metricsByHost.set(item.hostid, entry);
  }

  return hosts.map((h) => {
    const m = metricsByHost.get(h.hostid) ?? {};
    return {
      hostid: h.hostid,
      host: h.host,
      name: h.name,
      status: h.status,
      ip: h.interfaces[0]?.ip ?? null,
      cpuCount: m["system.cpu.num"] ? Number(m["system.cpu.num"]) : null,
      cpuUtil: m["system.cpu.util"] ? Number(m["system.cpu.util"]) : null,
      memTotalBytes: m["vm.memory.size[total]"] ? Number(m["vm.memory.size[total]"]) : null,
      memAvailableBytes: m["vm.memory.size[available]"] ? Number(m["vm.memory.size[available]"]) : null,
      os: m["system.sw.os.get"] ?? null,
      uptimeSeconds: m["system.uptime"] ? Number(m["system.uptime"]) : null,
    };
  });
}
