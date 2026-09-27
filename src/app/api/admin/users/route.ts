import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        licenseExpiresAt: true,
        createdAt: true,
        license: { select: { code: true } },
        _count: { select: { studySessions: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
