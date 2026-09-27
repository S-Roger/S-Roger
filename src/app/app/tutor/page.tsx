"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { MessagesSquare, Send, Bot, User } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Deck = { id: string; title: string; language: { name: string } };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi there! I'm your English tutor. What would you like to talk about today? You can ask me anything, or just start chatting in English!",
};

export default function TutorPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((data) => setDecks(data.decks ?? []));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId: deckId || undefined,
          messages: nextMessages.filter((m) => m !== WELCOME),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Der KI-Tutor konnte nicht antworten.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessagesSquare className="text-brand-600" size={22} />
          <h1 className="text-2xl font-bold">KI-Tutor</h1>
        </div>
        <select className="input w-auto text-sm" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
          <option value="">Freies Gespräch</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      <div className="card flex-1 overflow-y-auto p-5 space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-black/5 text-black/60"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-black/[0.04]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-black/5 text-black/60 flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className="rounded-2xl px-4 py-2.5 text-sm bg-black/[0.04] text-black/40">Tippt…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Schreibe auf Englisch…"
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary px-4">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
