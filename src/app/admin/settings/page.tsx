"use client";

import { useEffect, useState, FormEvent } from "react";
import { Settings, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setMinutes(data.defaultSessionMinutes ?? 10);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultSessionMinutes: minutes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Settings className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Einstellungen</h1>
      </div>
      <p className="text-black/55 mb-8">Steuere globale Optionen für alle Mitglieder.</p>

      <form onSubmit={handleSubmit} className="card p-6 max-w-md">
        <h2 className="font-bold mb-1">Lernzeit-Timer</h2>
        <p className="text-sm text-black/55 mb-4">
          Länge einer Lerneinheit in Minuten. Der Timer läuft während der Lernsession automatisch herunter.
        </p>
        {loading ? (
          <p className="text-sm text-black/40">Lade…</p>
        ) : (
          <>
            <label className="label">Standard-Lernzeit (Minuten)</label>
            <input
              type="number"
              min={1}
              max={180}
              className="input mb-4"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? "Speichere…" : saved ? "Gespeichert" : "Speichern"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
