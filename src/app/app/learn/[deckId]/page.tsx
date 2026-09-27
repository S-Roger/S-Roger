"use client";

import { useEffect, useRef, useState, use, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Check, X, RotateCcw, PartyPopper } from "lucide-react";
import clsx from "clsx";

type Item = {
  id: string;
  type: "WORD" | "PHRASE";
  term: string;
  translation: string;
  example: string | null;
  box: number;
  nextReviewAt: string | null;
};

type Deck = {
  id: string;
  title: string;
  items: Item[];
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LearnPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plannedSeconds, setPlannedSeconds] = useState(600);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [status, setStatus] = useState<"loading" | "running" | "finished">("loading");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [itemsReviewed, setItemsReviewed] = useState(0);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    async function init() {
      const [deckRes, sessionRes] = await Promise.all([
        fetch(`/api/decks/${deckId}`).then((r) => r.json()),
        fetch("/api/study-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deckId }),
        }).then((r) => r.json()),
      ]);
      const fetchedDeck: Deck = deckRes.deck;
      setDeck(fetchedDeck);

      const now = Date.now();
      const due = fetchedDeck.items.filter(
        (i) => i.box === 0 || (i.nextReviewAt ? new Date(i.nextReviewAt).getTime() <= now : true)
      );
      const rest = fetchedDeck.items.filter((i) => !due.includes(i));
      setQueue([...shuffle(due), ...shuffle(rest)]);

      const seconds = sessionRes.session.plannedSeconds;
      setSessionId(sessionRes.session.id);
      setPlannedSeconds(seconds);
      setSecondsLeft(seconds);
      startedAtRef.current = Date.now();
      setStatus("running");
    }
    init();
  }, [deckId]);

  const finishSession = useCallback(
    async (finalCorrect: number, finalWrong: number, finalReviewed: number) => {
      setStatus("finished");
      if (!sessionId) return;
      const actualSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      await fetch(`/api/study-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualSeconds,
          itemsReviewed: finalReviewed,
          correctCount: finalCorrect,
          wrongCount: finalWrong,
        }),
      });
    },
    [sessionId]
  );

  useEffect(() => {
    if (status !== "running") return;
    if (secondsLeft <= 0) {
      finishSession(correctCount, wrongCount, itemsReviewed);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [status, secondsLeft, finishSession, correctCount, wrongCount, itemsReviewed]);

  async function handleAnswer(correct: boolean) {
    const current = queue[currentIndex];
    if (!current) return;

    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabItemId: current.id, correct }),
    });

    const newCorrect = correctCount + (correct ? 1 : 0);
    const newWrong = wrongCount + (correct ? 0 : 1);
    const newReviewed = itemsReviewed + 1;
    setCorrectCount(newCorrect);
    setWrongCount(newWrong);
    setItemsReviewed(newReviewed);
    setRevealed(false);

    if (currentIndex + 1 >= queue.length) {
      if (secondsLeft > 0) {
        setQueue((q) => shuffle(q));
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleFinishEarly() {
    finishSession(correctCount, wrongCount, itemsReviewed);
  }

  if (status === "loading" || !deck) {
    return <p className="text-black/40">Lernsession wird vorbereitet…</p>;
  }

  if (status === "finished") {
    const accuracy = itemsReviewed > 0 ? Math.round((correctCount / itemsReviewed) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-5">
          <PartyPopper size={28} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Session beendet!</h1>
        <p className="text-black/55 mb-8">Gut gemacht — hier ist deine Zusammenfassung.</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold">{itemsReviewed}</p>
            <p className="text-xs text-black/50">Karten</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
            <p className="text-xs text-black/50">Trefferquote</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold">{formatTime(plannedSeconds - Math.max(secondsLeft, 0))}</p>
            <p className="text-xs text-black/50">Lernzeit</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href={`/app/decks/${deckId}`} className="btn btn-secondary">
            Zurück zum Set
          </Link>
          <Link href="/app/stats" className="btn btn-primary">
            Auswertungen ansehen
          </Link>
        </div>
      </div>
    );
  }

  const current = queue[currentIndex];
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / plannedSeconds) * 100));

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/app/decks/${deckId}`} className="inline-flex items-center gap-1.5 text-sm text-black/55 hover:text-black">
          <ArrowLeft size={15} /> Abbrechen
        </Link>
        <div className="flex items-center gap-2 font-mono font-semibold text-sm">
          <Clock size={15} className={secondsLeft <= 30 ? "text-red-500" : "text-brand-600"} />
          <span className={secondsLeft <= 30 ? "text-red-500" : ""}>{formatTime(Math.max(secondsLeft, 0))}</span>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-black/5 mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {current ? (
        <>
          <div
            onClick={() => setRevealed((r) => !r)}
            className="card p-10 min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer select-none mb-6"
          >
            <span className={clsx("badge mb-4", current.type === "WORD" ? "bg-black/5 text-black/60" : "bg-accent-400/15 text-accent-500")}>
              {current.type === "WORD" ? "Wort" : "Redewendung"}
            </span>
            <h2 className="text-3xl font-extrabold mb-3">{current.term}</h2>
            {revealed ? (
              <div className="animate-in fade-in">
                <p className="text-xl text-brand-600 font-semibold mb-2">{current.translation}</p>
                {current.example && <p className="text-black/50 italic">„{current.example}"</p>}
              </div>
            ) : (
              <p className="text-black/35 text-sm mt-2">Tippen, um Übersetzung zu zeigen</p>
            )}
          </div>

          {revealed && (
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleAnswer(false)} className="btn btn-danger py-3.5 text-base">
                <X size={18} /> Nochmal
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="btn py-3.5 text-base bg-green-100 text-green-700 hover:bg-green-200"
              >
                <Check size={18} /> Weiß ich
              </button>
            </div>
          )}

          <p className="text-center text-xs text-black/40 mt-6">
            Karte {currentIndex + 1} / {queue.length} · {itemsReviewed} bereits geübt
          </p>
        </>
      ) : (
        <div className="card p-10 text-center text-black/40">Dieses Set hat keine Vokabeln.</div>
      )}

      <div className="text-center mt-6">
        <button onClick={handleFinishEarly} className="btn btn-ghost text-sm text-black/45">
          <RotateCcw size={14} /> Session jetzt beenden
        </button>
      </div>
    </div>
  );
}
