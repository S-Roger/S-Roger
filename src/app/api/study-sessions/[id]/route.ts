import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const schema = z.object({
  actualSeconds: z.coerce.number().int().min(0),
  itemsReviewed: z.coerce.number().int().min(0),
  correctCount: z.coerce.number().int().min(0),
  wrongCount: z.coerce.number().int().min(0),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.studySession.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    }
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });

    const session = await prisma.studySession.update({
      where: { id },
      data: { ...parsed.data, endedAt: new Date() },
    });

    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
