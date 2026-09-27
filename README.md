# Lexoria — Englisch lernen mit KI

Webapplikation zum Lernen von englischen Vokabeln und Redewendungen mit KI-Unterstützung.

## Features

- **Adminbereich** — Nutzerverwaltung, Vokabelsets, Einstellungen, Auswertungen
- **Mitgliederbereich** — Lernen, KI-Tutor, persönliche Statistik
- **Lizenzgenerator** — Zugangscodes mit Gültigkeitsdauer & Aktivierungslimit
- **Lern-Timer** — Admin legt die Lernzeit fest, die während der Session herunterläuft
- **Leitner-System** — Vokabeln werden im optimalen Rhythmus wiederholt
- **KI-Vokabelimport** — Claude generiert Vokabeln/Redewendungen zu jedem Thema
- **KI-Lerntutor** — Chat-basiertes Übungsgespräch auf Englisch mit Korrekturen
- **Auswertungen** — Lernzeit, Trefferquote und Fortschritt als Charts

## Setup

```bash
npm install
npm run db:push    # Datenbank-Schema anlegen (SQLite)
npm run db:seed    # Admin-Account, Demo-Set & Demo-Lizenz anlegen
npm run dev
```

Umgebungsvariablen (siehe `.env.example`):

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="<langer, zufälliger String>"
ANTHROPIC_API_KEY="sk-ant-..."   # für KI-Import & KI-Tutor
```

Nach dem Seed:
- Admin-Login: `admin@lexoria.app` / `Admin123!`
- Eine Demo-Lizenz wird in der Konsole ausgegeben (auch unter **Admin → Lizenzen** sichtbar)

## Tech-Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma + SQLite · Anthropic Claude · Recharts
