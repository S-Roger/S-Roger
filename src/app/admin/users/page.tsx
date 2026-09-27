"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Ban, RotateCcw } from "lucide-react";
import clsx from "clsx";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  licenseExpiresAt: string | null;
  createdAt: string;
  license: { code: string } | null;
  _count: { studySessions: number };
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    await load();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Users className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Mitglieder</h1>
      </div>
      <p className="text-black/55 mb-8">Alle registrierten Nutzer:innen im Überblick.</p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/[0.02] text-left text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">E-Mail</th>
              <th className="px-5 py-3 font-semibold">Rolle</th>
              <th className="px-5 py-3 font-semibold">Lizenz gültig bis</th>
              <th className="px-5 py-3 font-semibold">Sessions</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-black/40">
                  Lade…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-black/40">
                  Noch keine Mitglieder.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="px-5 py-3 font-medium">{u.name}</td>
                <td className="px-5 py-3 text-black/60">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={clsx("badge", u.role === "ADMIN" ? "bg-brand-100 text-brand-700" : "bg-black/5 text-black/60")}>
                    {u.role === "ADMIN" ? "Admin" : "Mitglied"}
                  </span>
                </td>
                <td className="px-5 py-3 text-black/60">
                  {u.licenseExpiresAt ? new Date(u.licenseExpiresAt).toLocaleDateString("de-DE") : "—"}
                </td>
                <td className="px-5 py-3 text-black/60">{u._count.studySessions}</td>
                <td className="px-5 py-3">
                  <span className={clsx("badge", u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {u.isActive ? "Aktiv" : "Gesperrt"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {u.role !== "ADMIN" && (
                    <button onClick={() => toggleActive(u)} className="btn btn-ghost text-xs px-2 py-1">
                      {u.isActive ? <Ban size={14} /> : <RotateCcw size={14} />}
                      {u.isActive ? "Sperren" : "Entsperren"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
