import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { generateLicenseCode } from "@/lib/licenses";

export async function GET() {
  try {
    await requireAdmin();
    const licenses = await prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      include: { users: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ licenses });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  durationDays: z.coerce.number().int().min(1).max(3650),
  maxActivations: z.coerce.number().int().min(1).max(1000).default(1),
  note: z.string().max(200).optional(),
  count: z.coerce.number().int().min(1).max(100).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
    }
    const { durationDays, maxActivations, note, count } = parsed.data;

    const licenses = await Promise.all(
      Array.from({ length: count }).map(async () => {
        let code = generateLicenseCode();
        for (let attempt = 0; attempt < 5; attempt++) {
          const exists = await prisma.license.findUnique({ where: { code } });
          if (!exists) break;
          code = generateLicenseCode();
        }
        return prisma.license.create({
          data: { code, durationDays, maxActivations, note, createdById: admin.id },
        });
      })
    );

    return NextResponse.json({ licenses });
  } catch (err) {
    return handleApiError(err);
  }
}
