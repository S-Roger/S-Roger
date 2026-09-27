"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LogOut,
  LayoutDashboard,
  KeyRound,
  BookOpen,
  Sparkles,
  Settings,
  Users,
  BarChart3,
  MessagesSquare,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV_CONFIGS = {
  admin: [
    { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
    { href: "/admin/licenses", label: "Lizenzen", icon: KeyRound },
    { href: "/admin/users", label: "Mitglieder", icon: Users },
    { href: "/admin/decks", label: "Vokabelsets", icon: BookOpen },
    { href: "/admin/import", label: "KI-Import", icon: Sparkles },
    { href: "/admin/analytics", label: "Auswertungen", icon: BarChart3 },
    { href: "/admin/settings", label: "Einstellungen", icon: Settings },
  ],
  member: [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/decks", label: "Vokabelsets", icon: BookOpen },
    { href: "/app/tutor", label: "KI-Tutor", icon: MessagesSquare },
    { href: "/app/stats", label: "Auswertungen", icon: BarChart3 },
  ],
} as const;

export function Shell({
  variant,
  user,
  badge,
  children,
}: {
  variant: "admin" | "member";
  user: { name: string; email: string; role: string };
  badge?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = NAV_CONFIGS[variant];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-[#f7f7fb]">
      <aside className="w-64 shrink-0 border-r border-black/5 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-black/5">
          <Logo size="sm" />
          {badge && (
            <span className="badge bg-brand-100 text-brand-700 mt-2">{badge}</span>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-black/65 hover:bg-black/5 hover:text-black"
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-black/5">
          <div className="px-3 mb-2">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-black/45 truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost w-full justify-start text-sm">
            <LogOut size={16} /> Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
