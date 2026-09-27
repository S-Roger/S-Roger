import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const decks = await prisma.deck.findMany({
      orderBy: { createdAt: "desc" },
      include: { language: true, _count: { select: { items: true } } },
    });
    return NextResponse.json({ decks });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(400).optional(),
  level: z.string().min(1).max(10),
  languageId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
    }
    const deck = await prisma.deck.create({
      data: { ...parsed.data, createdById: admin.id },
      include: { language: true, _count: { select: { items: true } } },
    });
    return NextResponse.json({ deck });
  } catch (err) {
    return handleApiError(err);
  }
}
