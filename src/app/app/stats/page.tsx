"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { BarChart3, Clock, Target, BookOpenCheck, Trophy } from "lucide-react";

type Daily = { date: string; minutes: number; accuracy: number | null };
type BoxDist = { box: number; count: number };
type Stats = {
  daily: Daily[];
  boxDistribution: BoxDist[];
  totals: { sessions: number; minutes: number; accuracy: number; wordsTracked: number; mastered: number };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats/me")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-black/40">Lade Auswertungen…</p>;

  const chartData = stats.daily.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <BarChart3 className="text-brand-600" size={22} />
        <h1 className="text-2xl font-bold">Deine Auswertungen</h1>
      </div>
      <p className="text-black/55 mb-8">Fortschritt der letzten 14 Tage.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <Clock className="text-brand-600 mb-2" size={18} />
          <p className="text-2xl font-bold">{stats.totals.minutes} Min.</p>
          <p className="text-sm text-black/55">Lernzeit gesamt</p>
        </div>
        <div className="card p-5">
          <Target className="text-green-600 mb-2" size={18} />
          <p className="text-2xl font-bold">{stats.totals.accuracy}%</p>
          <p className="text-sm text-black/55">Trefferquote</p>
        </div>
        <div className="card p-5">
          <BookOpenCheck className="text-accent-500 mb-2" size={18} />
          <p className="text-2xl font-bold">{stats.totals.wordsTracked}</p>
          <p className="text-sm text-black/55">Vokabeln geübt</p>
        </div>
        <div className="card p-5">
          <Trophy className="text-orange-500 mb-2" size={18} />
          <p className="text-2xl font-bold">{stats.totals.mastered}</p>
          <p className="text-sm text-black/55">Gemeistert</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">Lernzeit pro Tag (Minuten)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7048ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7048ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="minutes" stroke="#7048ff" strokeWidth={2} fill="url(#minutesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-4">Fortschritt nach Leitner-Box</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.boxDistribution.map((b) => ({ box: `Box ${b.box}`, count: b.count }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
            <XAxis dataKey="box" tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#00000066" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b8ab" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
