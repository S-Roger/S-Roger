import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        language: true,
        items: {
          orderBy: { createdAt: "asc" },
          include: { progress: { where: { userId: user.id } } },
        },
      },
    });
    if (!deck) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

    const items = deck.items.map((item) => ({
      id: item.id,
      type: item.type,
      term: item.term,
      translation: item.translation,
      example: item.example,
      box: item.progress[0]?.box ?? 0,
      nextReviewAt: item.progress[0]?.nextReviewAt ?? null,
    }));

    return NextResponse.json({ deck: { ...deck, items } });
  } catch (err) {
    return handleApiError(err);
  }
}
