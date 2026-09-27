import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Name ist zu kurz").max(80),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  licenseCode: z.string().min(4, "Lizenzcode fehlt"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }
  const { name, email, password, licenseCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Diese E-Mail ist bereits registriert." }, { status: 409 });
  }

  const license = await prisma.license.findUnique({ where: { code: licenseCode.trim().toUpperCase() } });
  if (!license) {
    return NextResponse.json({ error: "Lizenzcode wurde nicht gefunden." }, { status: 404 });
  }
  if (license.status !== "ACTIVE") {
    return NextResponse.json({ error: "Dieser Lizenzcode ist nicht mehr gültig." }, { status: 400 });
  }
  if (license.activationsUsed >= license.maxActivations) {
    return NextResponse.json({ error: "Dieser Lizenzcode wurde bereits vollständig eingelöst." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const licenseExpiresAt = new Date();
  licenseExpiresAt.setDate(licenseExpiresAt.getDate() + license.durationDays);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "MEMBER",
        licenseId: license.id,
        licenseExpiresAt,
      },
    });

    const newActivations = license.activationsUsed + 1;
    await tx.license.update({
      where: { id: license.id },
      data: {
        activationsUsed: newActivations,
        status: newActivations >= license.maxActivations ? "EXHAUSTED" : "ACTIVE",
      },
    });

    return created;
  });

  await createUserSession({ sub: user.id, email: user.email, name: user.name, role: user.role });

  return NextResponse.json({ ok: true });
}
