"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type DayData = {
  date:       string;
  regular:    number;
  league:     number;
  tournament: number;
};

export default function ActivityChart({ data }: { data: DayData[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
        Sin datos de actividad
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "dd MMM", { locale: es }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="regular" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="league" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="tournament" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
          labelStyle={{ color: "#e4e4e7", fontSize: 12 }}
          itemStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }} />
        <Area type="monotone" dataKey="regular"    name="Regulares"  stroke="#6366f1" fill="url(#regular)"    strokeWidth={2} />
        <Area type="monotone" dataKey="league"     name="Ligas"      stroke="#10b981" fill="url(#league)"     strokeWidth={2} />
        <Area type="monotone" dataKey="tournament" name="Torneos"    stroke="#f59e0b" fill="url(#tournament)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
