"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Flame, ChevronRight } from "lucide-react";

type Deck = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  dueCount: number;
  language: { name: string };
  _count: { items: number };
};

export default function MemberDecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((data) => {
        setDecks(data.decks ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <BookOpen className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Vokabelsets</h1>
      </div>
      <p className="text-black/55 mb-8">Wähle ein Set und starte deine Lernsession.</p>

      {loading ? (
        <p className="text-black/40">Lade…</p>
      ) : decks.length === 0 ? (
        <div className="card p-10 text-center text-black/40">Es sind noch keine Vokabelsets verfügbar.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/app/decks/${deck.id}`} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="badge bg-brand-100 text-brand-700">{deck.level}</span>
                {deck.dueCount > 0 && (
                  <span className="badge bg-orange-100 text-orange-700">
                    <Flame size={11} /> {deck.dueCount} fällig
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
