import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BookOpen, Flame, Clock, TrendingUp, PlayCircle, MessagesSquare } from "lucide-react";

export default async function MemberDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [decks, sessions, progressRows] = await Promise.all([
    prisma.deck.findMany({ include: { language: true, _count: { select: { items: true } } } }),
    prisma.studySession.findMany({
      where: { userId: user.id, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    prisma.progress.findMany({ where: { userId: user.id } }),
  ]);

  const now = new Date();
  const dueCount = progressRows.filter((p) => p.nextReviewAt && p.nextReviewAt <= now).length;
  const totalItems = await prisma.vocabItem.count();
  const newCount = Math.max(totalItems - progressRows.length, 0);
  const totalSecondsThisWeek = sessions
    .filter((s) => s.startedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, s) => sum + (s.actualSeconds ?? 0), 0);
  const masteredCount = progressRows.filter((p) => p.box >= 5).length;

  const suggestedDeck = decks[0];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Hallo, {user.name.split(" ")[0]} 👋</h1>
      <p className="text-black/55 mb-8">Bereit für deine nächste Lerneinheit?</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
            <Flame size={18} />
          </div>
          <p className="text-2xl font-bold">{dueCount + newCount}</p>
          <p className="text-sm text-black/55">Fällig zum Üben</p>
        </div>
        <div className="card p-5">
          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <TrendingUp size={18} />
          </div>
          <p className="text-2xl font-bold">{masteredCount}</p>
          <p className="text-sm text-black/55">Gemeistert</p>
        </div>
        <div className="card p-5">
          <div className="h-9 w-9 rounded-lg bg-accent-400/15 text-accent-500 flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <p className="text-2xl font-bold">{Math.round(totalSecondsThisWeek / 60)} Min.</p>
          <p className="text-sm text-black/55">Diese Woche gelernt</p>
        </div>
        <div className="card p-5">
          <div className="h-9 w-9 rounded-lg bg-black/5 text-black/60 flex items-center justify-center mb-3">
            <BookOpen size={18} />
          </div>
          <p className="text-2xl font-bold">{decks.length}</p>
          <p className="text-sm text-black/55">Vokabelsets verfügbar</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-6">
          <h2 className="font-bold mb-1">Weiterlernen</h2>
          <p className="text-sm text-black/55 mb-4">
            {suggestedDeck ? `Setze deine Lernreihe mit "${suggestedDeck.title}" fort.` : "Noch keine Vokabelsets vorhanden."}
          </p>
          {suggestedDeck && (
            <Link href={`/app/learn/${suggestedDeck.id}`} className="btn btn-primary">
              <PlayCircle size={16} /> Jetzt lernen
            </Link>
          )}
        </div>
        <div className="card p-6">
          <h2 className="font-bold mb-1">Mit KI üben</h2>
          <p className="text-sm text-black/55 mb-4">Trainiere freies Sprechen und Schreiben im Chat mit deinem KI-Tutor.</p>
          <Link href="/app/tutor" className="btn btn-secondary">
            <MessagesSquare size={16} /> KI-Tutor öffnen
          </Link>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-4">Alle Vokabelsets</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/app/decks/${deck.id}`}
              className="rounded-lg border border-black/5 p-4 hover:border-brand-200 hover:bg-brand-50/40 transition-colors"
            >
              <span className="badge bg-brand-100 text-brand-700 mb-2">{deck.level}</span>
              <p className="font-semibold text-sm">{deck.title}</p>
              <p className="text-xs text-black/45">{deck._count.items} Wörter · {deck.language.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
