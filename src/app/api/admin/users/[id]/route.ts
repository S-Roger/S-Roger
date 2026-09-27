import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const schema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json({ error: "Du kannst dein eigenes Konto nicht ändern." }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
