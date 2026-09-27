import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const DAYS = 14;

export async function GET() {
  try {
    await requireAdmin();
    const since = new Date();
    since.setDate(since.getDate() - (DAYS - 1));
    since.setHours(0, 0, 0, 0);

    const sessions = await prisma.studySession.findMany({
      where: { startedAt: { gte: since } },
      include: { user: { select: { name: true, email: true } }, deck: { select: { title: true } } },
      orderBy: { startedAt: "asc" },
    });

    const dayBuckets: Record<string, { minutes: number; sessions: number; users: Set<string> }> = {};
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets[key] = { minutes: 0, sessions: 0, users: new Set() };
    }
    for (const s of sessions) {
      const key = s.startedAt.toISOString().slice(0, 10);
      if (!dayBuckets[key]) continue;
      dayBuckets[key].minutes += Math.round((s.actualSeconds ?? 0) / 60);
      dayBuckets[key].sessions += 1;
      dayBuckets[key].users.add(s.userId);
    }
    const daily = Object.entries(dayBuckets).map(([date, v]) => ({
      date,
      minutes: v.minutes,
      sessions: v.sessions,
      activeUsers: v.users.size,
    }));

    const deckUsage = new Map<string, { title: string; sessions: number; minutes: number }>();
    for (const s of sessions) {
      if (!s.deck) continue;
      const entry = deckUsage.get(s.deck.title) ?? { title: s.deck.title, sessions: 0, minutes: 0 };
      entry.sessions += 1;
      entry.minutes += Math.round((s.actualSeconds ?? 0) / 60);
      deckUsage.set(s.deck.title, entry);
    }

    const userMinutes = new Map<string, { name: string; email: string; minutes: number; sessions: number }>();
    for (const s of sessions) {
      const key = s.user.email;
      const entry = userMinutes.get(key) ?? { name: s.user.name, email: s.user.email, minutes: 0, sessions: 0 };
      entry.minutes += Math.round((s.actualSeconds ?? 0) / 60);
      entry.sessions += 1;
      userMinutes.set(key, entry);
    }
    const topUsers = [...userMinutes.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 8);

    const totalCorrect = sessions.reduce((s, sess) => s + sess.correctCount, 0);
    const totalWrong = sessions.reduce((s, sess) => s + sess.wrongCount, 0);

    return NextResponse.json({
      daily,
      deckUsage: [...deckUsage.values()],
      topUsers,
      totals: {
        sessions: sessions.length,
        minutes: sessions.reduce((s, sess) => s + Math.round((sess.actualSeconds ?? 0) / 60), 0),
        accuracy: totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
