import { PlayerCardFIFA } from "@components/player/player-card-fifa";

export default function DemoPlayerCardPage() {
  const demoPlayer = {
    name: "Alex Mate",
    position: "Revés",
    global: 72,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    attributes: {
      der: 72,
      rev: 66,
      vol: 68,
      ban: 67,
      rem: 83,
      glo: 80,
      atq: 75,
      def: 70,
      mnt: 55,
      fis: 80,
    },
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: "#0f172a" }}>
      <h1 style={{ color: "#fff", marginBottom: "2rem", textAlign: "center" }}>Player Card - FIFA Style</h1>
      <PlayerCardFIFA {...demoPlayer} />
    </div>
  );
}
