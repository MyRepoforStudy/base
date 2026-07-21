import { prisma } from "./prisma";
import { getLinuxHosts } from "./zabbix";

export type MergedServer = {
  hostname: string;
  ip: string | null;
  status: "enabled" | "disabled";
  os: string | null;
  cpuCount: number | null;
  cpuUtilPercent: number | null;
  memTotalGb: number | null;
  memAvailableGb: number | null;
  uptimeSeconds: number | null;
  environment: string;
  datacenter: string;
  virtual: boolean;
  vendor: string | null;
  model: string | null;
  supportEnd: string | null;
  hasStaticRecord: boolean;
};

export async function getMergedServers(): Promise<MergedServer[]> {
  const [zabbixResult, staticResult] = await Promise.allSettled([getLinuxHosts(), prisma.server.findMany()]);

  if (zabbixResult.status === "rejected") {
    throw zabbixResult.reason instanceof Error ? zabbixResult.reason : new Error("Failed to reach Zabbix");
  }
  const zabbixHosts = zabbixResult.value;
  const staticRecords = staticResult.status === "fulfilled" ? staticResult.value : [];
  if (staticResult.status === "rejected") {
    console.error("CMDB database unreachable, falling back to Zabbix-only data:", staticResult.reason);
  }

  const staticByHostname = new Map(staticRecords.map((s) => [s.hostname.toLowerCase(), s]));

  return zabbixHosts.map((h) => {
    const st = staticByHostname.get(h.host.toLowerCase());
    return {
      hostname: h.host,
      ip: h.ip,
      status: h.status === "0" ? "enabled" : "disabled",
      os: h.os,
      cpuCount: h.cpuCount,
      cpuUtilPercent: h.cpuUtil,
      memTotalGb: h.memTotalBytes ? h.memTotalBytes / 1024 ** 3 : null,
      memAvailableGb: h.memAvailableBytes ? h.memAvailableBytes / 1024 ** 3 : null,
      uptimeSeconds: h.uptimeSeconds,
      environment: st?.environment ?? "UNKNOWN",
      datacenter: st?.datacenter ?? "UNKNOWN",
      virtual: st?.virtual ?? true,
      vendor: st?.vendor ?? null,
      model: st?.model ?? null,
      supportEnd: st?.supportEnd ? st.supportEnd.toISOString() : null,
      hasStaticRecord: Boolean(st),
    };
  });
}
