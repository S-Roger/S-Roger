import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireUser();
    const decks = await prisma.deck.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        language: true,
        _count: { select: { items: true } },
      },
    });

    const now = new Date();
    const decksWithDue = await Promise.all(
      decks.map(async (deck) => {
        const dueCount = await prisma.vocabItem.count({
          where: {
            deckId: deck.id,
            OR: [
              { progress: { none: { userId: user.id } } },
              { progress: { some: { userId: user.id, nextReviewAt: { lte: now } } } },
            ],
          },
        });
        return { ...deck, dueCount };
      })
    );

    return NextResponse.json({ decks: decksWithDue });
  } catch (err) {
    return handleApiError(err);
  }
}
