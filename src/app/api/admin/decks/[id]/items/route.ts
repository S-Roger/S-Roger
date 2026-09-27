import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const itemSchema = z.object({
  type: z.enum(["WORD", "PHRASE"]).default("WORD"),
  term: z.string().min(1).max(200),
  translation: z.string().min(1).max(200),
  example: z.string().max(400).optional(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) return NextResponse.json({ error: "Vokabelset nicht gefunden." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
    }

    const created = await prisma.vocabItem.createMany({
      data: parsed.data.items.map((item) => ({ ...item, deckId: id })),
    });

    return NextResponse.json({ count: created.count });
  } catch (err) {
    return handleApiError(err);
  }
}
