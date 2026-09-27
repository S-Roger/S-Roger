"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseCode, setLicenseCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, licenseCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registrierung fehlgeschlagen.");
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>
        <div className="card p-7">
          <h1 className="text-lg font-bold mb-1">Konto erstellen</h1>
          <p className="text-sm text-black/55 mb-6">
            Du benötigst einen gültigen Lizenzcode von deinem Anbieter.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                required
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
              />
            </div>
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
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mind. 8 Zeichen"
              />
            </div>
            <div>
              <label className="label">Lizenzcode</label>
              <input
                required
                className="input uppercase"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder="LEXO-XXXX-XXXX-XXXX"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              <UserPlus size={16} />
              {loading ? "Wird erstellt…" : "Konto erstellen"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-black/55 mt-5">
          Bereits registriert?{" "}
          <Link href="/login" className="text-brand-600 font-semibold">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
