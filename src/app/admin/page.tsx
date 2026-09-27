import { prisma } from "@/lib/prisma";
import { Users, KeyRound, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [userCount, activeLicenses, deckCount, itemCount, sessionsToday] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.license.count({ where: { status: "ACTIVE" } }),
    prisma.deck.count(),
    prisma.vocabItem.count(),
    prisma.studySession.count({
      where: { startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);
  return { userCount, activeLicenses, deckCount, itemCount, sessionsToday };
}

export default async function AdminOverview() {
  const stats = await getStats();

  const cards = [
    { label: "Mitglieder", value: stats.userCount, icon: Users, href: "/admin/users" },
    { label: "Aktive Lizenzen", value: stats.activeLicenses, icon: KeyRound, href: "/admin/licenses" },
    { label: "Vokabelsets", value: stats.deckCount, icon: BookOpen, href: "/admin/decks" },
    { label: "Lernsessions heute", value: stats.sessionsToday, icon: Clock, href: "/admin/analytics" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Übersicht</h1>
      <p className="text-black/55 mb-8">Willkommen im Lexoria Adminbereich.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 hover:shadow-md transition-shadow">
            <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <c.icon size={18} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-black/55">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-2">Erste Schritte</h2>
        <ol className="list-decimal list-inside text-sm text-black/65 space-y-1.5">
          <li>
            Lege unter <Link href="/admin/decks" className="text-brand-600 font-medium">Vokabelsets</Link> eine Sprache
            und ein erstes Set an, oder nutze den{" "}
            <Link href="/admin/import" className="text-brand-600 font-medium">KI-Import</Link>.
          </li>
          <li>
            Generiere unter <Link href="/admin/licenses" className="text-brand-600 font-medium">Lizenzen</Link> Zugangscodes
            für neue Mitglieder.
          </li>
          <li>
            Stelle unter <Link href="/admin/settings" className="text-brand-600 font-medium">Einstellungen</Link> die
            Standard-Lernzeit für den Timer ein.
          </li>
        </ol>
      </div>
    </div>
  );
}
