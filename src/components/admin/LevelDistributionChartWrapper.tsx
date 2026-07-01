import { db } from "@db/index";
import { players } from "@db/schema";
import LevelDistributionChart from "@components/admin/LevelDistributionChart";

const RANGES = [
  { label: "1-10",  min: 1,  max: 10  },
  { label: "11-20", min: 11, max: 20  },
  { label: "21-30", min: 21, max: 30  },
  { label: "31-40", min: 31, max: 40  },
  { label: "41-50", min: 41, max: 50  },
];

export default async function LevelDistributionChartWrapper() {
  const allPlayers = await db.select({ level: players.level }).from(players);

  const data = RANGES.map(({ label, min, max }) => ({
    range: label,
    count: allPlayers.filter((p) => p.level >= min && p.level <= max).length,
  }));

  return <LevelDistributionChart data={data} />;
}
