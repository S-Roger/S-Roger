import Link from "next/link";
import {
  Sparkles,
  BrainCircuit,
  TimerReset,
  BarChart3,
  KeyRound,
  MessagesSquare,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "KI-Vokabelimport",
    text: "Lass Claude passende Vokabeln und Redewendungen zu jedem Thema und Sprachniveau generieren.",
  },
  {
    icon: MessagesSquare,
    title: "KI-Lernpartner",
    text: "Übe freies Sprechen und Schreiben im Chat mit deinem persönlichen KI-Tutor.",
  },
  {
    icon: TimerReset,
    title: "Fokus-Timer",
    text: "Jede Lerneinheit läuft in einem festen Zeitfenster ab — für konzentriertes, planbares Lernen.",
  },
  {
    icon: BarChart3,
    title: "Klare Auswertungen",
    text: "Verfolge Fortschritt, Trefferquote und Lernzeit in übersichtlichen Statistiken.",
  },
  {
    icon: KeyRound,
    title: "Lizenzverwaltung",
    text: "Zugänge werden komfortabel über generierte Lizenzcodes gesteuert.",
  },
  {
    icon: Sparkles,
    title: "Leitner-System",
    text: "Karteikarten wiederholen sich automatisch im optimalen Rhythmus für dein Gedächtnis.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const ctaHref = user ? (user.role === "ADMIN" ? "/admin" : "/app") : "/register";
  const ctaLabel = user ? "Zum Dashboard" : "Kostenlos starten";

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          {user ? (
            <Link href={ctaHref} className="btn btn-primary">
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Anmelden
              </Link>
              <Link href="/register" className="btn btn-primary">
                Registrieren
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 badge bg-brand-100 text-brand-700 mb-6">
          <Sparkles size={13} /> Englisch lernen, neu gedacht
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] max-w-3xl mx-auto">
          Vokabeln lernen mit{" "}
          <span className="bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text text-transparent">
            KI-Power
          </span>
        </h1>
        <p className="mt-6 text-lg text-black/60 max-w-2xl mx-auto">
          Lexoria kombiniert smarte Karteikarten, einen persönlichen KI-Tutor und
          einen fokussierten Lerntimer — für nachhaltigen Fortschritt in Englisch.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link href={ctaHref} className="btn btn-primary px-6 py-3 text-base">
            {ctaLabel} <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-secondary px-6 py-3 text-base">
            Anmelden
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-bold mb-1.5">{f.title}</h3>
              <p className="text-sm text-black/60 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        © {new Date().getFullYear()} Lexoria — Englisch lernen mit KI
      </footer>
    </div>
  );
}
