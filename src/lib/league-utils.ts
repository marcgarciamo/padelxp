import { nanoid } from "nanoid";

export function generateInviteCode(): string {
  return nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, "X").slice(0, 8);
}

export const MATCH_FORMAT_LABELS: Record<string, string> = {
  best_of_3:               "Mejor de 3 sets",
  best_of_3_supertiebreak: "Mejor de 3 sets (con súper tie-break)",
  timed:                   "Por tiempo (más games ganados)",
};

export const SCORING_SYSTEM_LABELS: Record<string, string> = {
  classic_advantage: "Ventajas clásicas (Deuce tradicional)",
  golden_point:      "Punto de Oro (primer Deuce decisivo)",
  star_point:        "Star Point (mecánica PadelXP)",
};

export const COURT_MANAGEMENT_LABELS: Record<string, string> = {
  centralized:   "Centralizada (el organizador reserva las pistas)",
  decentralized: "Descentralizada (cada equipo reserva su pista)",
};

export const TEAM_FORMAT_LABELS: Record<string, string> = {
  fixed_pairs: "Parejas fijas (equipos de 2 inscritos juntos)",
  individual:  "Individual (el sistema empareja por ELO cada jornada)",
};

export function validateParticipantCount(
  count: number,
  format: "fixed_pairs" | "individual"
): { valid: boolean; message?: string } {
  if (format === "fixed_pairs") {
    if (count < 6)           return { valid: false, message: "Mínimo 6 jugadores (3 parejas)" };
    if (count % 2 !== 0)     return { valid: false, message: "Debe ser un número par de jugadores" };
  }
  if (format === "individual") {
    if (count < 4)           return { valid: false, message: "Mínimo 4 jugadores" };
    if (count % 4 !== 0)     return { valid: false, message: "Recomendado múltiplo de 4 para evitar descansos" };
  }
  return { valid: true };
}

export function generateVariablePairings(
  players: Array<{ id: string; elo: number; displayName: string }>
): Array<{ team1: [string, string]; team2: [string, string] }> {
  const sorted  = [...players].sort((a, b) => b.elo - a.elo);
  const pairings: Array<{ team1: [string, string]; team2: [string, string] }> = [];

  for (let i = 0; i < sorted.length - 3; i += 4) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const p3 = sorted[i + 2];
    const p4 = sorted[i + 3];
    if (!p1 || !p2 || !p3 || !p4) continue;
    pairings.push({ team1: [p1.id, p4.id], team2: [p2.id, p3.id] });
  }

  return pairings;
}
