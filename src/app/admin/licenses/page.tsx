"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { KeyRound, Copy, Check, Ban, RotateCcw, Plus } from "lucide-react";
import clsx from "clsx";

type License = {
  id: string;
  code: string;
  durationDays: number;
  maxActivations: number;
  activationsUsed: number;
  status: "ACTIVE" | "REVOKED" | "EXHAUSTED";
  note: string | null;
  createdAt: string;
  users: { id: string; name: string; email: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  REVOKED: "bg-red-100 text-red-700",
  EXHAUSTED: "bg-black/10 text-black/50",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktiv",
  REVOKED: "Widerrufen",
  EXHAUSTED: "Ausgeschöpft",
};

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationDays, setDurationDays] = useState(365);
  const [maxActivations, setMaxActivations] = useState(1);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/licenses");
    const data = await res.json();
    setLicenses(data.licenses ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays, maxActivations, count, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Erstellen.");
        return;
      }
      setNote("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(license: License) {
    const nextStatus = license.status === "ACTIVE" ? "REVOKED" : "ACTIVE";
    await fetch(`/api/admin/licenses/${license.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await load();
  }

  function copyCode(license: License) {
    navigator.clipboard.writeText(license.code);
    setCopiedId(license.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <KeyRound className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Lizenzen</h1>
      </div>
      <p className="text-black/55 mb-8">
        Generiere Zugangscodes, die neue Mitglieder bei der Registrierung einlösen.
      </p>

      <form onSubmit={handleCreate} className="card p-6 mb-8 grid sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="label">Gültigkeit (Tage)</label>
          <input
            type="number"
            min={1}
            className="input"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Max. Aktivierungen</label>
          <input
            type="number"
            min={1}
            className="input"
            value={maxActivations}
            onChange={(e) => setMaxActivations(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Anzahl Codes</label>
          <input
            type="number"
            min={1}
            max={100}
            className="input"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="label">Notiz (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z.B. Kunde XY" />
        </div>
        <div className="sm:col-span-4">
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" disabled={creating} className="btn btn-primary">
            <Plus size={16} /> {creating ? "Erstelle…" : "Lizenz(en) generieren"}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-5 py-3 font-semibold">Code</th>
              <th className="px-5 py-3 font-semibold">Gültigkeit</th>
              <th className="px-5 py-3 font-semibold">Aktivierungen</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Notiz</th>
              <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-black/40">
                  Lade…
                </td>
              </tr>
            )}
            {!loading && licenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-black/40">
                  Noch keine Lizenzen erstellt.
                </td>
              </tr>
            )}
            {licenses.map((license) => (
              <tr key={license.id} className="border-t border-black/5">
                <td className="px-5 py-3 font-mono text-xs">
                  <button onClick={() => copyCode(license)} className="flex items-center gap-1.5 hover:text-brand-600">
                    {license.code}
                    {copiedId === license.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </td>
                <td className="px-5 py-3">{license.durationDays} Tage</td>
                <td className="px-5 py-3">
                  {license.activationsUsed} / {license.maxActivations}
                </td>
                <td className="px-5 py-3">
                  <span className={clsx("badge", STATUS_STYLES[license.status])}>
                    {STATUS_LABEL[license.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-black/50">{license.note ?? "—"}</td>
                <td className="px-5 py-3 text-right">
                  {license.status !== "EXHAUSTED" && (
                    <button
                      onClick={() => toggleStatus(license)}
                      className="btn btn-ghost text-xs px-2 py-1"
                      title={license.status === "ACTIVE" ? "Widerrufen" : "Reaktivieren"}
                    >
                      {license.status === "ACTIVE" ? <Ban size={14} /> : <RotateCcw size={14} />}
                      {license.status === "ACTIVE" ? "Widerrufen" : "Reaktivieren"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
