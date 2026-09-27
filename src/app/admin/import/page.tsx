"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { Sparkles, Wand2, Save, Trash2 } from "lucide-react";

type Language = { id: string; name: string };
type GeneratedItem = { type: "WORD" | "PHRASE"; term: string; translation: string; example: string };

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function ImportPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageId, setLanguageId] = useState("");
  const [languageName, setLanguageName] = useState("Englisch");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("A1");
  const [count, setCount] = useState(15);
  const [includePhrases, setIncludePhrases] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [deckTitle, setDeckTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadLanguages = useCallback(async () => {
    const res = await fetch("/api/admin/languages");
    const data = await res.json();
    setLanguages(data.languages ?? []);
    if (data.languages?.length) {
      setLanguageId(data.languages[0].id);
      setLanguageName(data.languages[0].name);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);
    setItems([]);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageName, topic, level, count, includePhrases }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "KI-Import fehlgeschlagen.");
        return;
      }
      setItems(data.items);
      setDeckTitle(topic);
    } finally {
      setGenerating(false);
    }
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!languageId) {
      setError("Bitte zuerst eine Sprache im Bereich Vokabelsets anlegen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const deckRes = await fetch("/api/admin/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: deckTitle || topic, level, languageId, description: `KI-generiert: ${topic}` }),
      });
      const deckData = await deckRes.json();
      if (!deckRes.ok) {
        setError(deckData.error ?? "Vokabelset konnte nicht erstellt werden.");
        return;
      }

      const itemsRes = await fetch(`/api/admin/decks/${deckData.deck.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setError(itemsData.error ?? "Vokabeln konnten nicht gespeichert werden.");
        return;
      }

      setSaved(true);
      setItems([]);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Sparkles className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">KI-Vokabelimport</h1>
      </div>
      <p className="text-black/55 mb-8">
        Lass Claude passende Vokabeln und Redewendungen zu jedem Thema generieren.
      </p>

      <form onSubmit={handleGenerate} className="card p-6 mb-8 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Sprache</label>
          <select
            className="input"
            value={languageId}
            onChange={(e) => {
              setLanguageId(e.target.value);
              const lang = languages.find((l) => l.id === e.target.value);
              if (lang) setLanguageName(lang.name);
            }}
          >
            {languages.length === 0 && <option value="">Keine Sprache vorhanden</option>}
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Niveau (CEFR)</label>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Thema</label>
          <input
            required
            className="input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Im Restaurant, Business-Meetings, Reisen…"
          />
        </div>
        <div>
          <label className="label">Anzahl Vokabeln</label>
          <input
            type="number"
            min={1}
            max={40}
            className="input"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="includePhrases"
            type="checkbox"
            checked={includePhrases}
            onChange={(e) => setIncludePhrases(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="includePhrases" className="text-sm">
            Auch Redewendungen einbeziehen
          </label>
        </div>
        <div className="sm:col-span-2">
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" disabled={generating || !languageId} className="btn btn-primary">
            <Wand2 size={16} /> {generating ? "Generiere…" : "Vokabeln generieren"}
          </button>
        </div>
      </form>

      {items.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-wrap items-end gap-4 justify-between mb-5">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Name des Vokabelsets</label>
              <input className="input" value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              <Save size={16} /> {saving ? "Speichere…" : saved ? "Gespeichert!" : `${items.length} Einträge speichern`}
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-black/5 p-3">
                <span className="badge bg-black/5 text-black/60 mt-0.5 shrink-0">
                  {item.type === "WORD" ? "Wort" : "Phrase"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {item.term} <span className="text-black/40">→</span> {item.translation}
                  </p>
                  {item.example && <p className="text-sm text-black/50 italic">{item.example}</p>}
                </div>
                <button onClick={() => removeItem(i)} className="text-black/30 hover:text-red-600 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
