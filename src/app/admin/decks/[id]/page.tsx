"use client";

import { useEffect, useState, FormEvent, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import clsx from "clsx";

type VocabItem = {
  id: string;
  type: "WORD" | "PHRASE";
  term: string;
  translation: string;
  example: string | null;
};

type Deck = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  language: { name: string };
  items: VocabItem[];
};

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"WORD" | "PHRASE">("WORD");
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ term: "", translation: "", example: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/decks/${id}`);
    const data = await res.json();
    setDeck(data.deck ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await fetch(`/api/admin/decks/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ type, term, translation, example: example || undefined }] }),
      });
      setTerm("");
      setTranslation("");
      setExample("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(itemId: string) {
    await fetch(`/api/admin/vocab-items/${itemId}`, { method: "DELETE" });
    await load();
  }

  function startEdit(item: VocabItem) {
    setEditingId(item.id);
    setEditDraft({ term: item.term, translation: item.translation, example: item.example ?? "" });
  }

  async function saveEdit(itemId: string) {
    await fetch(`/api/admin/vocab-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setEditingId(null);
    await load();
  }

  if (loading) return <p className="text-black/40">Lade…</p>;
  if (!deck) return <p className="text-black/40">Vokabelset nicht gefunden.</p>;

  return (
    <div>
      <Link href="/admin/decks" className="inline-flex items-center gap-1.5 text-sm text-black/55 hover:text-black mb-4">
        <ArrowLeft size={15} /> Zurück zu den Vokabelsets
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <span className="badge bg-brand-100 text-brand-700">{deck.level}</span>
        <h1 className="text-2xl font-bold">{deck.title}</h1>
      </div>
      <p className="text-black/55 mb-8">
        {deck.language.name} · {deck.items.length} Einträge{deck.description ? ` · ${deck.description}` : ""}
      </p>

      <form onSubmit={handleAdd} className="card p-5 mb-8 grid sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="label">Typ</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as "WORD" | "PHRASE")}>
            <option value="WORD">Wort</option>
            <option value="PHRASE">Redewendung</option>
          </select>
        </div>
        <div>
          <label className="label">Englisch</label>
          <input required className="input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="apple" />
        </div>
        <div>
          <label className="label">Übersetzung</label>
          <input required className="input" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="der Apfel" />
        </div>
        <div>
          <label className="label">Beispiel (optional)</label>
          <input className="input" value={example} onChange={(e) => setExample(e.target.value)} placeholder="I eat an apple." />
        </div>
        <button type="submit" disabled={adding} className="btn btn-primary h-fit">
          <Plus size={16} /> {adding ? "…" : "Hinzufügen"}
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-5 py-3 font-semibold">Typ</th>
              <th className="px-5 py-3 font-semibold">Englisch</th>
              <th className="px-5 py-3 font-semibold">Übersetzung</th>
              <th className="px-5 py-3 font-semibold">Beispiel</th>
              <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {deck.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-black/40">
                  Noch keine Einträge.
                </td>
              </tr>
            )}
            {deck.items.map((item) => (
              <tr key={item.id} className="border-t border-black/5 align-top">
                <td className="px-5 py-3">
                  <span className={clsx("badge", item.type === "WORD" ? "bg-black/5 text-black/60" : "bg-accent-400/15 text-accent-500")}>
                    {item.type === "WORD" ? "Wort" : "Redewendung"}
                  </span>
                </td>
                {editingId === item.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input
                        className="input"
                        value={editDraft.term}
                        onChange={(e) => setEditDraft((d) => ({ ...d, term: e.target.value }))}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        className="input"
                        value={editDraft.translation}
                        onChange={(e) => setEditDraft((d) => ({ ...d, translation: e.target.value }))}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        className="input"
                        value={editDraft.example}
                        onChange={(e) => setEditDraft((d) => ({ ...d, example: e.target.value }))}
                      />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => saveEdit(item.id)} className="btn btn-ghost text-xs px-2 py-1">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn btn-ghost text-xs px-2 py-1">
                        <X size={14} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 font-medium">{item.term}</td>
                    <td className="px-5 py-3">{item.translation}</td>
                    <td className="px-5 py-3 text-black/50 italic">{item.example || "—"}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(item)} className="btn btn-ghost text-xs px-2 py-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-ghost text-xs px-2 py-1 text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
