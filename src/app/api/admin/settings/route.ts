import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { getDefaultSessionMinutes, setSetting, SETTINGS_KEYS } from "@/lib/settings";

export async function GET() {
  try {
    await requireAdmin();
    const defaultSessionMinutes = await getDefaultSessionMinutes();
    return NextResponse.json({ defaultSessionMinutes });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  defaultSessionMinutes: z.coerce.number().int().min(1).max(180),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    await setSetting(SETTINGS_KEYS.DEFAULT_SESSION_MINUTES, String(parsed.data.defaultSessionMinutes));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
