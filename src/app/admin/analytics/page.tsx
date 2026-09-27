"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { BarChart3, Clock, Users, Target } from "lucide-react";

type Daily = { date: string; minutes: number; sessions: number; activeUsers: number };
type DeckUsage = { title: string; sessions: number; minutes: number };
type TopUser = { name: string; email: string; minutes: number; sessions: number };
type Analytics = {
  daily: Daily[];
  deckUsage: DeckUsage[];
  topUsers: TopUser[];
  totals: { sessions: number; minutes: number; accuracy: number };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-black/40">Lade Auswertungen…</p>;

  const chartData = data.daily.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <BarChart3 className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Auswertungen</h1>
      </div>
      <p className="text-black/55 mb-8">Aktivität aller Mitglieder der letzten 14 Tage.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <Clock className="text-brand-600 mb-2" size={18} />
          <p className="text-2xl font-bold">{data.totals.minutes} Min.</p>
          <p className="text-sm text-black/55">Gesamte Lernzeit</p>
        </div>
        <div className="card p-5">
          <Users className="text-accent-500 mb-2" size={18} />
          <p className="text-2xl font-bold">{data.totals.sessions}</p>
          <p className="text-sm text-black/55">Lernsessions</p>
        </div>
        <div className="card p-5">
          <Target className="text-green-600 mb-2" size={18} />
          <p className="text-2xl font-bold">{data.totals.accuracy}%</p>
          <p className="text-sm text-black/55">Ø Trefferquote</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">Aktivität pro Tag</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="minutes" name="Minuten" stroke="#7048ff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="activeUsers" name="Aktive Nutzer" stroke="#10b8ab" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold mb-4">Beliebteste Vokabelsets</h2>
          {data.deckUsage.length === 0 ? (
            <p className="text-black/40 text-sm">Noch keine Daten.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.deckUsage} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="sessions" name="Sessions" fill="#7048ff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-bold mb-4">Aktivste Mitglieder</h2>
          <div className="space-y-3">
            {data.topUsers.length === 0 && <p className="text-black/40 text-sm">Noch keine Daten.</p>}
            {data.topUsers.map((u) => (
              <div key={u.email} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-black/45 text-xs">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{u.minutes} Min.</p>
                  <p className="text-black/45 text-xs">{u.sessions} Sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
