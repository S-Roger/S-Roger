import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const languages = await prisma.language.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ languages });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(2).max(60),
  flag: z.string().max(8).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    const language = await prisma.language.create({ data: parsed.data });
    return NextResponse.json({ language });
  } catch (err) {
    return handleApiError(err);
  }
}
