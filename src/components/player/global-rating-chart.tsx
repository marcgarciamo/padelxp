"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EloHistory } from "@db/schema";
import { eloToGlobalRating } from "@lib/elo";

interface GlobalRatingChartProps {
  history: EloHistory[];
}

export function GlobalRatingChart({ history }: GlobalRatingChartProps) {
  const data = [...history]
    .reverse()
    .map((h) => ({
      date:   format(new Date(h.recordedAt), "d MMM", { locale: es }),
      rating: eloToGlobalRating(h.elo),
      delta:  h.delta,
    }));

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "13px" }}>
        Juega partidos para ver tu evolución de Media Global.
      </div>
    );
  }

  const minRating = Math.max(50, Math.min(...data.map((d) => d.rating)) - 3);
  const maxRating = Math.min(99, Math.max(...data.map((d) => d.rating)) + 3);

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis domain={[minRating, maxRating]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#22262f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }}
            formatter={(value: any, _: any, props: any) => [
              `Media ${value} (${props.payload.delta >= 0 ? "+" : ""}${props.payload.delta})`,
              "",
            ]}
            labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#7c5cfc"
            strokeWidth={2}
            fill="url(#ratingGradient)"
            dot={{ fill: "#7c5cfc", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: "#a78bfa" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
