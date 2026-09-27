import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const DAYS = 14;

export async function GET() {
  try {
    const user = await requireUser();
    const since = new Date();
    since.setDate(since.getDate() - (DAYS - 1));
    since.setHours(0, 0, 0, 0);

    const [sessions, progressRows] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: user.id, startedAt: { gte: since } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.progress.findMany({ where: { userId: user.id } }),
    ]);

    const dayBuckets: Record<string, { minutes: number; correct: number; wrong: number }> = {};
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets[key] = { minutes: 0, correct: 0, wrong: 0 };
    }
    for (const s of sessions) {
      const key = s.startedAt.toISOString().slice(0, 10);
      if (!dayBuckets[key]) continue;
      dayBuckets[key].minutes += Math.round((s.actualSeconds ?? 0) / 60);
      dayBuckets[key].correct += s.correctCount;
      dayBuckets[key].wrong += s.wrongCount;
    }

    const daily = Object.entries(dayBuckets).map(([date, v]) => ({
      date,
      minutes: v.minutes,
      accuracy: v.correct + v.wrong > 0 ? Math.round((v.correct / (v.correct + v.wrong)) * 100) : null,
    }));

    const boxDistribution = [1, 2, 3, 4, 5].map((box) => ({
      box,
      count: progressRows.filter((p) => p.box === box).length,
    }));

    const totalCorrect = progressRows.reduce((s, p) => s + p.correctCount, 0);
    const totalWrong = progressRows.reduce((s, p) => s + p.wrongCount, 0);
    const totalMinutes = sessions.reduce((s, sess) => s + Math.round((sess.actualSeconds ?? 0) / 60), 0);

    return NextResponse.json({
      daily,
      boxDistribution,
      totals: {
        sessions: sessions.length,
        minutes: totalMinutes,
        accuracy: totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0,
        wordsTracked: progressRows.length,
        mastered: progressRows.filter((p) => p.box >= 5).length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
