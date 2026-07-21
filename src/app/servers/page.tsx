"use client";

import { useEffect, useMemo, useState } from "react";
import { getDistro, formatUptime, formatGb } from "@/lib/constants";
import type { MergedServer } from "@/lib/servers";

export default function ServersPage() {
  const [servers, setServers] = useState<MergedServer[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [envFilter, setEnvFilter] = useState("All");
  const [osFilter, setOsFilter] = useState("All");
  const [virtualFilter, setVirtualFilter] = useState("All");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/servers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load servers");
      setServers(data.servers);
      setSyncedAt(data.syncedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load servers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const environments = useMemo(
    () => ["All", ...Array.from(new Set(servers.map((s) => s.environment)))],
    [servers]
  );
  const osOptions = useMemo(
    () => ["All", ...Array.from(new Set(servers.map((s) => getDistro(s.os))))],
    [servers]
  );

  const filtered = servers.filter((s) => {
    if (envFilter !== "All" && s.environment !== envFilter) return false;
    if (osFilter !== "All" && getDistro(s.os) !== osFilter) return false;
    if (virtualFilter !== "All") {
      const wantVirtual = virtualFilter === "Virtual";
      if (s.virtual !== wantVirtual) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">SERVERS OVERVIEW</h1>
          <p className="text-sm text-neutral-500">
            SERVERS {servers.length}
            {syncedAt && <> · Last Zabbix sync: {new Date(syncedAt).toLocaleString()}</>}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Refresh Zabbix
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap gap-3 rounded-lg border border-black/10 bg-white p-4">
        <Filter label="Environment" value={envFilter} options={environments} onChange={setEnvFilter} />
        <Filter label="OS" value={osFilter} options={osOptions} onChange={setOsFilter} />
        <Filter
          label="Virtual"
          value={virtualFilter}
          options={["All", "Virtual", "Physical"]}
          onChange={setVirtualFilter}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Server</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">Environment</th>
              <th className="px-3 py-2">OS</th>
              <th className="px-3 py-2">Virtual</th>
              <th className="px-3 py-2">Vendor / Model</th>
              <th className="px-3 py-2">CPU</th>
              <th className="px-3 py-2">RAM</th>
              <th className="px-3 py-2">Uptime</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-neutral-400">
                  No servers match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.hostname} className="border-b border-black/5">
                  <td className="px-3 py-2 font-medium">{s.hostname}</td>
                  <td className="px-3 py-2 text-neutral-500">{s.ip ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold">
                      {s.environment}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{s.os ?? "—"}</td>
                  <td className="px-3 py-2">{s.virtual ? "YES" : "NO"}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {s.vendor || s.model ? `${s.vendor ?? "—"} ${s.model ?? ""}`.trim() : "—"}
                  </td>
                  <td className="px-3 py-2">{s.cpuCount ?? "—"}</td>
                  <td className="px-3 py-2">{formatGb(s.memTotalGb)}</td>
                  <td className="px-3 py-2">{formatUptime(s.uptimeSeconds)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        s.status === "enabled"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
