"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Layers } from "lucide-react";

type Item = { id: string; type: "WORD" | "PHRASE"; term: string; translation: string; box: number };
type Deck = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  language: { name: string };
  items: Item[];
};

export default function MemberDeckDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDeck(data.deck ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-black/40">Lade…</p>;
  if (!deck) return <p className="text-black/40">Vokabelset nicht gefunden.</p>;

  const dueCount = deck.items.filter((i) => i.box === 0 || i.box < 5).length;

  return (
    <div>
      <Link href="/app/decks" className="inline-flex items-center gap-1.5 text-sm text-black/55 hover:text-black mb-4">
        <ArrowLeft size={15} /> Zurück zu den Vokabelsets
      </Link>

      <div className="card p-7 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge bg-brand-100 text-brand-700">{deck.level}</span>
          <span className="text-sm text-black/45">{deck.language.name}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{deck.title}</h1>
        <p className="text-black/55 mb-6">{deck.description}</p>
        <div className="flex items-center gap-3">
          <Link href={`/app/learn/${deck.id}`} className="btn btn-primary px-5 py-2.5">
            <PlayCircle size={18} /> Lernsession starten
          </Link>
          <span className="text-sm text-black/45 flex items-center gap-1.5">
            <Layers size={14} /> {deck.items.length} Einträge · {dueCount} zu üben
          </span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-5 py-3 font-semibold">Englisch</th>
              <th className="px-5 py-3 font-semibold">Übersetzung</th>
              <th className="px-5 py-3 font-semibold">Fortschritt</th>
            </tr>
          </thead>
          <tbody>
            {deck.items.map((item) => (
              <tr key={item.id} className="border-t border-black/5">
                <td className="px-5 py-3 font-medium">{item.term}</td>
                <td className="px-5 py-3">{item.translation}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((b) => (
                      <div
                        key={b}
                        className={`h-1.5 w-5 rounded-full ${b <= item.box ? "bg-brand-500" : "bg-black/10"}`}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
