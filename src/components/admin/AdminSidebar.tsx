"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarRange, Users, Swords,
  ShieldAlert, Activity, ArrowLeft, Shield, LogOut
} from "lucide-react";

type Props = {
  username: string;
  activeSeason: { id: string; name: string } | null;
};

const links = [
  { href: "/admin/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/seasons",    label: "Temporadas",   icon: CalendarRange },
  { href: "/admin/users",      label: "Jugadores",    icon: Users },
  { href: "/admin/matches",    label: "Partidos",     icon: Swords },
  { href: "/admin/moderation", label: "Moderación",   icon: ShieldAlert },
  { href: "/admin/activity",   label: "Actividad",    icon: Activity },
];

export default function AdminSidebar({ username, activeSeason }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin-login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col sticky top-0 h-screen hidden md:flex">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="size-5 text-violet-400" />
          <span className="font-bold text-white text-sm">PadelXP</span>
        </div>
        <span className="text-xs text-violet-400 font-medium tracking-widest uppercase">Admin Panel</span>
      </div>

      {/* Active season indicator */}
      <div className="px-4 py-3 border-b border-zinc-800">
        {activeSeason ? (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-zinc-400 truncate">{activeSeason.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-500">Sin temporada activa</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-violet-600/20 text-violet-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white">
            {username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{username}</p>
            <span className="text-xs font-medium text-violet-400">admin</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="size-3" />
            Ver app
          </Link>
          <span className="text-zinc-700">·</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="size-3" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
