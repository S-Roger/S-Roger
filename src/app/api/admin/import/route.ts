import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";

const schema = z.object({
  languageName: z.string().min(2).max(60),
  nativeLanguage: z.string().min(2).max(60).default("Deutsch"),
  topic: z.string().min(2).max(200),
  level: z.string().min(1).max(10),
  count: z.coerce.number().int().min(1).max(40),
  includePhrases: z.boolean().default(true),
});

const itemSchema = z.object({
  type: z.enum(["WORD", "PHRASE"]),
  term: z.string(),
  translation: z.string(),
  example: z.string().optional().default(""),
});

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Keine gültige JSON-Antwort erhalten.");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
    }
    const { languageName, nativeLanguage, topic, level, count, includePhrases } = parsed.data;

    const client = getAnthropicClient();
    const prompt = `Erstelle eine Vokabelliste zum Thema "${topic}" für Lernende der Sprache ${languageName} auf CEFR-Niveau ${level}. Die Übersetzung soll auf ${nativeLanguage} sein.
Erzeuge genau ${count} Einträge${includePhrases ? ", davon einige nützliche Redewendungen (type: PHRASE) und den Rest einzelne Wörter (type: WORD)" : " ausschließlich einzelne Wörter (type: WORD)"}.
Gib ausschließlich ein JSON-Array zurück, ohne weitere Erklärungen, in exakt diesem Format:
[{"type": "WORD", "term": "<Begriff in ${languageName}>", "translation": "<Übersetzung auf ${nativeLanguage}>", "example": "<kurzer Beispielsatz in ${languageName}>"}]`;

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Keine Textantwort von der KI erhalten.");
    }

    const json = extractJson(textBlock.text);
    const items = z.array(itemSchema).parse(json);

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Error && /ANTHROPIC_API_KEY/.test(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof SyntaxError || (err && typeof err === "object" && "issues" in err)) {
      return NextResponse.json({ error: "Die KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen." }, { status: 502 });
    }
    return handleApiError(err);
  }
}
