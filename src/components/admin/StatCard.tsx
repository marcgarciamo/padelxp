import type { LucideIcon } from "lucide-react";

type Props = {
  title:  string;
  value:  string | number;
  delta?: string;
  icon:   LucideIcon;
  alert?: boolean;
};

export default function StatCard({ title, value, delta, icon: Icon, alert }: Props) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-5 flex items-start gap-4 ${alert ? "border-red-500/40" : "border-zinc-800"}`}>
      <div className={`p-2.5 rounded-lg ${alert ? "bg-red-500/10" : "bg-violet-500/10"}`}>
        <Icon className={`size-5 ${alert ? "text-red-400" : "text-violet-400"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-2xl font-bold ${alert && Number(value) > 0 ? "text-red-300" : "text-white"}`}>{value}</p>
        {delta && <p className="text-xs text-emerald-400 mt-0.5">{delta}</p>}
      </div>
    </div>
  );
}
