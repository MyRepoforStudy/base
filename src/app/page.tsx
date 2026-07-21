import { getMergedServers } from "@/lib/servers";
import { getDistro, describeError } from "@/lib/constants";

export const dynamic = "force-dynamic";

function count<T extends string>(items: T[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

export default async function OverviewPage() {
  let servers: Awaited<ReturnType<typeof getMergedServers>> = [];
  let error: string | null = null;

  try {
    servers = await getMergedServers();
  } catch (e) {
    console.error("OverviewPage: getMergedServers failed:", e);
    error = describeError(e);
  }

  const total = servers.length;
  const osCounts = count(servers.map((s) => getDistro(s.os)));
  const envCounts = count(servers.map((s) => s.environment));
  const virtualCount = servers.filter((s) => s.virtual).length;
  const physicalCount = total - virtualCount;
  const datacenterCounts = count(servers.map((s) => s.datacenter));
  const missingRecord = servers.filter((s) => !s.hasStaticRecord).length;

  const eosl = servers
    .filter((s) => s.supportEnd)
    .sort((a, b) => new Date(a.supportEnd!).getTime() - new Date(b.supportEnd!).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">SUMMARY OVERVIEW</h1>
        <p className="text-sm text-neutral-500">
          SERVERS {total} · Last Zabbix sync: {new Date().toLocaleString()}
        </p>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not reach Zabbix: {error}
        </div>
      )}

      {missingRecord > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingRecord} server(s) have no CMDB record (Vendor/Model/Datacenter/Environment) — fill them in on the{" "}
          <a href="/admin" className="font-semibold underline">
            Admin
          </a>{" "}
          page.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Servers">
          <div className="text-4xl font-bold text-neutral-900">{total}</div>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600">
            <li className="flex justify-between">
              <span>Virtual</span>
              <span className="font-semibold">{virtualCount}</span>
            </li>
            <li className="flex justify-between">
              <span>Physical</span>
              <span className="font-semibold">{physicalCount}</span>
            </li>
          </ul>
        </Card>

        <Card title="Environment">
          <ul className="space-y-1 text-sm">
            {Object.entries(envCounts).map(([env, n]) => (
              <li key={env} className="flex justify-between">
                <span className="text-neutral-600">{env}</span>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Datacenter Footprint">
          <ul className="space-y-1 text-sm">
            {Object.entries(datacenterCounts).map(([dc, n]) => (
              <li key={dc} className="flex justify-between">
                <span className="text-neutral-600">{dc}</span>
                <span className="font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Operating Systems">
        <div className="space-y-2">
          {Object.entries(osCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([os, n]) => (
              <div key={os} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 text-neutral-600">{os}</span>
                <div className="h-3 flex-1 rounded bg-neutral-100">
                  <div
                    className="h-3 rounded bg-red-600"
                    style={{ width: `${total ? (n / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right font-semibold">{n}</span>
              </div>
            ))}
        </div>
      </Card>

      <Card title="Support End (EOSL)">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-neutral-500">
              <th className="py-2">Server</th>
              <th>Vendor</th>
              <th>Model</th>
              <th>Datacenter</th>
              <th>Support End</th>
            </tr>
          </thead>
          <tbody>
            {eosl.map((s) => {
              const daysLeft = Math.floor(
                (new Date(s.supportEnd!).getTime() - Date.now()) / 86400000
              );
              const status =
                daysLeft < 0 ? "EXPIRED" : daysLeft < 180 ? "EXPIRES SOON" : "ACTIVE";
              const color =
                status === "EXPIRED"
                  ? "bg-red-100 text-red-700"
                  : status === "EXPIRES SOON"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700";
              return (
                <tr key={s.hostname} className="border-b border-black/5">
                  <td className="py-2 font-medium">{s.hostname}</td>
                  <td>{s.vendor ?? "—"}</td>
                  <td>{s.model ?? "—"}</td>
                  <td>{s.datacenter}</td>
                  <td>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${color}`}>
                      {new Date(s.supportEnd!).toLocaleDateString()} · {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {eosl.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-neutral-400">
                  No support-end dates recorded yet — add them on the Admin page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </div>
  );
}
