import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createUserSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte E-Mail und Passwort angeben." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });
  }

  if (user.role === "MEMBER" && user.licenseExpiresAt && user.licenseExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Deine Lizenz ist abgelaufen. Bitte kontaktiere den Support." },
      { status: 403 }
    );
  }

  await createUserSession({ sub: user.id, email: user.email, name: user.name, role: user.role });

  return NextResponse.json({ ok: true, role: user.role });
}
