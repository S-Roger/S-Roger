"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Plus, ChevronRight, Sparkles } from "lucide-react";

type Language = { id: string; name: string; code: string; flag: string | null };
type Deck = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  isAiGenerated: boolean;
  language: Language;
  _count: { items: number };
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("A1");
  const [languageId, setLanguageId] = useState("");
  const [newLangName, setNewLangName] = useState("");
  const [newLangCode, setNewLangCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [decksRes, langsRes] = await Promise.all([
      fetch("/api/admin/decks"),
      fetch("/api/admin/languages"),
    ]);
    const decksData = await decksRes.json();
    const langsData = await langsRes.json();
    setDecks(decksData.decks ?? []);
    setLanguages(langsData.languages ?? []);
    if (langsData.languages?.length && !languageId) setLanguageId(langsData.languages[0].id);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      let langId = languageId;
      if (langId === "__new__") {
        if (!newLangName || !newLangCode) {
          setError("Bitte Sprachname und Kürzel angeben.");
          return;
        }
        const langRes = await fetch("/api/admin/languages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newLangName, code: newLangCode }),
        });
        const langData = await langRes.json();
        if (!langRes.ok) {
          setError(langData.error ?? "Sprache konnte nicht erstellt werden.");
          return;
        }
        langId = langData.language.id;
      }

      const res = await fetch("/api/admin/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, level, languageId: langId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Erstellen.");
        return;
      }
      setTitle("");
      setDescription("");
      setNewLangName("");
      setNewLangCode("");
      setShowForm(false);
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-600" size={22} />
          <h1 className="text-2xl font-bold">Vokabelsets</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import" className="btn btn-secondary">
            <Sparkles size={16} /> KI-Import
          </Link>
          <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary">
            <Plus size={16} /> Neues Set
          </button>
        </div>
      </div>
      <p className="text-black/55 mb-8">Verwalte Sprachen, Vokabelsets und einzelne Wörter/Redewendungen.</p>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-8 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Titel</label>
            <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Reisen & Urlaub" />
          </div>
          <div>
            <label className="label">Niveau</label>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Beschreibung (optional)</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Sprache</label>
            <select className="input" value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              <option value="__new__">+ Neue Sprache…</option>
            </select>
          </div>
          {languageId === "__new__" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">Sprachname</label>
                <input className="input" value={newLangName} onChange={(e) => setNewLangName(e.target.value)} placeholder="Englisch" />
              </div>
              <div className="w-24">
                <label className="label">Kürzel</label>
                <input className="input" value={newLangCode} onChange={(e) => setNewLangCode(e.target.value)} placeholder="en" />
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? "Erstelle…" : "Vokabelset erstellen"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-black/40">Lade…</p>
      ) : decks.length === 0 ? (
        <div className="card p-10 text-center text-black/40">Noch keine Vokabelsets erstellt.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/admin/decks/${deck.id}`} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="badge bg-brand-100 text-brand-700">{deck.level}</span>
                {deck.isAiGenerated && (
                  <span className="badge bg-accent-400/15 text-accent-500">
                    <Sparkles size={11} /> KI
                  </span>
                )}
              </div>
              <h3 className="font-bold mb-1">{deck.title}</h3>
              <p className="text-sm text-black/55 mb-3 line-clamp-2">{deck.description || "—"}</p>
              <div className="flex items-center justify-between text-xs text-black/45">
                <span>{deck.language.name}</span>
                <span className="flex items-center gap-1">
                  {deck._count.items} Wörter <ChevronRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
