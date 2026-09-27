"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      const next = params.get("next");
      router.push(next ?? (data.role === "ADMIN" ? "/admin" : "/app"));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>
        <div className="card p-7">
          <h1 className="text-lg font-bold mb-1">Willkommen zurück</h1>
          <p className="text-sm text-black/55 mb-6">Melde dich an, um weiterzulernen.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-Mail</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
              />
            </div>
            <div>
              <label className="label">Passwort</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              <LogIn size={16} />
              {loading ? "Wird angemeldet…" : "Anmelden"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-black/55 mt-5">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-brand-600 font-semibold">
            Mit Lizenzcode registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
