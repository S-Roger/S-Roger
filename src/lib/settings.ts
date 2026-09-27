import { prisma } from "@/lib/prisma";

export const SETTINGS_KEYS = {
  DEFAULT_SESSION_MINUTES: "default_session_minutes",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTINGS_KEYS.DEFAULT_SESSION_MINUTES]: "10",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.settings.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function setSetting(key: string, value: string) {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function getDefaultSessionMinutes(): Promise<number> {
  const value = await getSetting(SETTINGS_KEYS.DEFAULT_SESSION_MINUTES);
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}
