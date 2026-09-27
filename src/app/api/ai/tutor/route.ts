import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";

const schema = z.object({
  deckId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    const { deckId, messages } = parsed.data;

    let vocabHint = "";
    if (deckId) {
      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
        include: { items: { take: 25 } },
      });
      if (deck) {
        const words = deck.items.map((i) => `${i.term} (${i.translation})`).join(", ");
        vocabHint = `\nBaue, wo es natürlich passt, Vokabeln aus dem aktuellen Set "${deck.title}" ein: ${words}.`;
      }
    }

    const systemPrompt = `Du bist ein freundlicher, geduldiger Englisch-Sprachtutor für deutschsprachige Lernende. Führe eine natürliche Unterhaltung auf Englisch, angepasst an das Niveau der Person. Korrigiere Fehler behutsam: nenne kurz die korrigierte Version und danach eine sehr knappe Erklärung auf Deutsch, dann führe das Gespräch fort. Stelle Rückfragen, um das Gespräch am Laufen zu halten. Halte Antworten kurz (max. 4-5 Sätze).${vocabHint}`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof Error && /ANTHROPIC_API_KEY/.test(err.message)) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return handleApiError(err);
  }
}
