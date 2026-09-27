import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { nextBoxOnCorrect, nextBoxOnWrong, computeNextReviewAt } from "@/lib/leitner";

const schema = z.object({
  vocabItemId: z.string(),
  correct: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    const { vocabItemId, correct } = parsed.data;

    const existing = await prisma.progress.findUnique({
      where: { userId_vocabItemId: { userId: user.id, vocabItemId } },
    });

    const currentBox = existing?.box ?? 1;
    const newBox = correct ? nextBoxOnCorrect(currentBox) : nextBoxOnWrong();
    const now = new Date();

    const progress = await prisma.progress.upsert({
      where: { userId_vocabItemId: { userId: user.id, vocabItemId } },
      create: {
        userId: user.id,
        vocabItemId,
        box: newBox,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1,
        lastReviewedAt: now,
        nextReviewAt: computeNextReviewAt(newBox, now),
      },
      update: {
        box: newBox,
        correctCount: { increment: correct ? 1 : 0 },
        wrongCount: { increment: correct ? 0 : 1 },
        lastReviewedAt: now,
        nextReviewAt: computeNextReviewAt(newBox, now),
      },
    });

    return NextResponse.json({ progress });
  } catch (err) {
    return handleApiError(err);
  }
}
