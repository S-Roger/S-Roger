import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateLicenseCode } from "../src/lib/licenses";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@lexoria.app";
  const adminPassword = "Admin123!";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    });
    console.log(`Admin erstellt: ${adminEmail} / ${adminPassword}`);
  }

  await prisma.settings.upsert({
    where: { key: "default_session_minutes" },
    update: {},
    create: { key: "default_session_minutes", value: "10" },
  });

  let english = await prisma.language.findUnique({ where: { code: "en" } });
  if (!english) {
    english = await prisma.language.create({ data: { code: "en", name: "Englisch", flag: "🇬🇧" } });
  }

  const existingDeck = await prisma.deck.findFirst({ where: { title: "Grundwortschatz: Im Alltag" } });
  if (!existingDeck) {
    const deck = await prisma.deck.create({
      data: {
        title: "Grundwortschatz: Im Alltag",
        description: "Wichtige Wörter und Redewendungen für den Alltag",
        level: "A1",
        languageId: english.id,
      },
    });

    await prisma.vocabItem.createMany({
      data: [
        { deckId: deck.id, type: "WORD", term: "house", translation: "das Haus", example: "This is my house." },
        { deckId: deck.id, type: "WORD", term: "friend", translation: "der Freund / die Freundin", example: "She is my best friend." },
        { deckId: deck.id, type: "WORD", term: "water", translation: "das Wasser", example: "I drink a lot of water." },
        { deckId: deck.id, type: "WORD", term: "morning", translation: "der Morgen", example: "Good morning!" },
        { deckId: deck.id, type: "WORD", term: "work", translation: "die Arbeit / arbeiten", example: "I go to work by bike." },
        { deckId: deck.id, type: "WORD", term: "family", translation: "die Familie", example: "I love my family." },
        { deckId: deck.id, type: "WORD", term: "food", translation: "das Essen", example: "The food is delicious." },
        { deckId: deck.id, type: "PHRASE", term: "How are you?", translation: "Wie geht es dir?", example: "Hi! How are you today?" },
        { deckId: deck.id, type: "PHRASE", term: "Nice to meet you", translation: "Schön, dich kennenzulernen", example: "Nice to meet you, I'm Anna." },
        { deckId: deck.id, type: "PHRASE", term: "See you later", translation: "Bis später", example: "I have to go now, see you later!" },
      ],
    });
    console.log("Beispiel-Vokabelset erstellt.");
  }

  const existingLicense = await prisma.license.findFirst({ where: { note: "Demo-Lizenz" } });
  if (!existingLicense) {
    const code = generateLicenseCode();
    await prisma.license.create({
      data: { code, durationDays: 365, maxActivations: 5, note: "Demo-Lizenz" },
    });
    console.log(`Demo-Lizenzcode erstellt: ${code}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
