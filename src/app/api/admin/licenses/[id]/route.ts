import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const schema = z.object({
  status: z.enum(["ACTIVE", "REVOKED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    const license = await prisma.license.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ license });
  } catch (err) {
    return handleApiError(err);
  }
}
