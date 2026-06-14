import PlayerCard from "@components/player/player-card";

export default function DemoPlayerCardPage() {
  const demoPlayer = {
    displayName: "Alex Mate",
    position: "left",
    elo: 1250,
    level: 8,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    attrAttack: 75,
    attrDefense: 70,
    attrVolley: 68,
    attrConsistency: 72,
    totalWins: 24,
    totalLosses: 8,
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
      <h1 style={{ color: "#fff", marginBottom: "1rem", textAlign: "center" }}>Player Card — nuevo layout</h1>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
        <PlayerCard player={demoPlayer} size="sm" />
        <PlayerCard player={demoPlayer} size="md" />
        <PlayerCard player={demoPlayer} size="lg" />
      </div>
    </div>
  );
}
