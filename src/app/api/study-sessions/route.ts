import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { getDefaultSessionMinutes } from "@/lib/settings";

const schema = z.object({
  deckId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });

    const minutes = await getDefaultSessionMinutes();
    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        deckId: parsed.data.deckId,
        plannedSeconds: minutes * 60,
      },
    });

    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
