"use client";

import { useEffect, useState } from "react";
import { ENVIRONMENTS, DATACENTERS } from "@/lib/constants";

type ServerRecord = {
  hostname: string;
  environment: string;
  datacenter: string;
  virtual: boolean;
  vendor: string | null;
  model: string | null;
  supportEnd: string | null;
  notes: string | null;
};

const emptyForm = {
  hostname: "",
  environment: "PROD",
  datacenter: "MAIN",
  virtual: true,
  vendor: "",
  model: "",
  supportEnd: "",
  notes: "",
};

export default function AdminPage() {
  const [records, setRecords] = useState<ServerRecord[]>([]);
  const [knownHostnames, setKnownHostnames] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/servers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load CMDB records");
      setRecords(data.records ?? []);
      setKnownHostnames(data.knownHostnames ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load CMDB records");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function editRecord(r: ServerRecord) {
    setForm({
      hostname: r.hostname,
      environment: r.environment,
      datacenter: r.datacenter,
      virtual: r.virtual,
      vendor: r.vendor ?? "",
      model: r.model ?? "",
      supportEnd: r.supportEnd ? r.supportEnd.slice(0, 10) : "",
      notes: r.notes ?? "",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(hostname: string) {
    await fetch(`/api/admin/servers/${encodeURIComponent(hostname)}`, { method: "DELETE" });
    await load();
  }

  const knownWithoutRecord = knownHostnames.filter(
    (h) => !records.some((r) => r.hostname.toLowerCase() === h.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">SERVER CMDB ADMIN</h1>
        <p className="text-sm text-neutral-500">
          Vendor / Model / Datacenter / Environment / Support End are not available in Zabbix — maintain them here.
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 bg-white p-4 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Hostname
          <input
            list="known-hostnames"
            required
            value={form.hostname}
            onChange={(e) => setForm({ ...form, hostname: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          />
          <datalist id="known-hostnames">
            {knownHostnames.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Environment
          <select
            value={form.environment}
            onChange={(e) => setForm({ ...form, environment: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          >
            {ENVIRONMENTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Datacenter
          <select
            value={form.datacenter}
            onChange={(e) => setForm({ ...form, datacenter: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          >
            {DATACENTERS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Virtual
          <select
            value={form.virtual ? "yes" : "no"}
            onChange={(e) => setForm({ ...form, virtual: e.target.value === "yes" })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          >
            <option value="yes">Virtual</option>
            <option value="no">Physical</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Vendor
          <input
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Model
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Support End
          <input
            type="date"
            value={form.supportEnd}
            onChange={(e) => setForm({ ...form, supportEnd: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500">
          Notes
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded border border-black/10 px-2 py-1 text-sm font-normal text-neutral-800"
          />
        </label>

        <div className="col-span-2 flex items-end gap-2 md:col-span-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {form.hostname && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {knownWithoutRecord.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {knownWithoutRecord.length} host(s) seen in Zabbix have no CMDB record yet: {knownWithoutRecord.join(", ")}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Hostname</th>
              <th className="px-3 py-2">Environment</th>
              <th className="px-3 py-2">Datacenter</th>
              <th className="px-3 py-2">Virtual</th>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Support End</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.hostname} className="border-b border-black/5">
                <td className="px-3 py-2 font-medium">{r.hostname}</td>
                <td className="px-3 py-2">{r.environment}</td>
                <td className="px-3 py-2">{r.datacenter}</td>
                <td className="px-3 py-2">{r.virtual ? "Virtual" : "Physical"}</td>
                <td className="px-3 py-2">{r.vendor ?? "—"}</td>
                <td className="px-3 py-2">{r.model ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.supportEnd ? new Date(r.supportEnd).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => editRecord(r)} className="mr-3 text-xs font-semibold text-red-600">
                    Edit
                  </button>
                  <button onClick={() => remove(r.hostname)} className="text-xs font-semibold text-neutral-400">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-neutral-400">
                  No CMDB records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
