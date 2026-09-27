import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { language: true, items: { orderBy: { createdAt: "asc" } } },
    });
    if (!deck) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    return NextResponse.json({ deck });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(400).optional(),
  level: z.string().min(1).max(10).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    const deck = await prisma.deck.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ deck });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.deck.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
