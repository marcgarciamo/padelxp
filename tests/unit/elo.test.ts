import { describe, it, expect } from "vitest";
import {
  eloToGlobalRating,
  expectedScore,
  getScoreMultiplier,
  calculateElo,
  calculateMatchElo,
} from "@/lib/elo";

describe("eloToGlobalRating", () => {
  // Formula: ratio=(elo-1000)/(2200-1000), rating=round(50+ratio*49)
  // ELO 1000 (base) → 50, ELO 2200 (max) → 99, ELO 800 → 42

  it("returns 50 at ELO_BASE (1000)", () => {
    expect(eloToGlobalRating(1000)).toBe(50);
  });

  it("returns 99 at maximum ELO (2200)", () => {
    expect(eloToGlobalRating(2200)).toBe(99);
  });

  it("returns 99 at ELO above maximum", () => {
    expect(eloToGlobalRating(9999)).toBe(99);
  });

  it("returns 42 at minimum ELO (800)", () => {
    // ratio=(800-1000)/1200=-0.167, rating=round(50-8.17)=42
    expect(eloToGlobalRating(800)).toBe(42);
  });

  it("clamps ELO below 800 same as 800", () => {
    expect(eloToGlobalRating(500)).toBe(eloToGlobalRating(800));
  });

  it("returns ~75 at ELO 1600", () => {
    const rating = eloToGlobalRating(1600);
    expect(rating).toBeGreaterThanOrEqual(73);
    expect(rating).toBeLessThanOrEqual(77);
  });
});

describe("expectedScore", () => {
  it("equal ELOs → 0.5", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
  });

  it("higher ELO → score above 0.5", () => {
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  });

  it("lower ELO → score below 0.5", () => {
    expect(expectedScore(800, 1000)).toBeLessThan(0.5);
  });

  it("400-point advantage → ~0.91", () => {
    // 1/(1+10^(-400/400)) = 1/(1+0.1) = 0.909
    expect(expectedScore(1400, 1000)).toBeCloseTo(0.909, 2);
  });
});

describe("getScoreMultiplier", () => {
  it("2 sets → 1.0", () => {
    expect(getScoreMultiplier([{ team1: 6, team2: 3 }, { team1: 6, team2: 2 }])).toBe(1.0);
  });

  it("3 sets → 0.75", () => {
    expect(
      getScoreMultiplier([
        { team1: 6, team2: 3 },
        { team1: 3, team2: 6 },
        { team1: 7, team2: 5 },
      ])
    ).toBe(0.75);
  });
});

describe("calculateElo", () => {
  it("winner gains ELO when underdog wins", () => {
    const result = calculateElo(900, 1100, true);
    expect(result.delta).toBeGreaterThan(0);
    expect(result.newElo).toBeGreaterThan(900);
  });

  it("loser loses ELO when favourite loses", () => {
    const result = calculateElo(1100, 900, false);
    expect(result.delta).toBeLessThan(0);
    expect(result.newElo).toBeLessThan(1100);
  });

  it("ELO never drops below 800", () => {
    const result = calculateElo(800, 2200, false);
    expect(result.newElo).toBe(800);
  });

  it("score multiplier reduces delta", () => {
    const full   = calculateElo(1000, 1000, true, 1.0);
    const reduced = calculateElo(1000, 1000, true, 0.75);
    expect(Math.abs(reduced.delta)).toBeLessThan(Math.abs(full.delta));
  });
});

describe("calculateMatchElo", () => {
  it("returns correct structure", () => {
    const result = calculateMatchElo([1000, 1000], [1000, 1000], true);
    expect(result.team1).toHaveLength(2);
    expect(result.team2).toHaveLength(2);
    expect(result.team1[0]).toHaveProperty("newElo");
    expect(result.team1[0]).toHaveProperty("delta");
  });

  it("winning team gains ELO", () => {
    const result = calculateMatchElo([1000, 1000], [1000, 1000], true);
    expect(result.team1[0].delta).toBeGreaterThan(0);
    expect(result.team1[1].delta).toBeGreaterThan(0);
  });

  it("losing team loses ELO", () => {
    const result = calculateMatchElo([1000, 1000], [1000, 1000], true);
    expect(result.team2[0].delta).toBeLessThan(0);
    expect(result.team2[1].delta).toBeLessThan(0);
  });

  it("underdog win → bigger delta for winner", () => {
    const result = calculateMatchElo([900, 900], [1200, 1200], true);
    expect(result.team1[0].delta).toBeGreaterThan(16);
  });

  it("favourite win → small positive delta for winner", () => {
    // Big favourite wins → expected high, actual=1 → small gain
    const result = calculateMatchElo([1200, 1200], [900, 900], true);
    expect(result.team1[0].delta).toBeGreaterThan(0);
    expect(result.team1[0].delta).toBeLessThan(16);
  });

  it("team2Won=false equivalent to team1Won=true", () => {
    const a = calculateMatchElo([1000, 1000], [1000, 1000], true);
    expect(a.team1[0].delta).toBe(a.team1[1].delta);
    expect(a.team2[0].delta).toBe(a.team2[1].delta);
  });
});
