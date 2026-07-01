import { describe, it, expect } from "vitest";
import {
  calculateXpGain,
  xpForLevel,
  xpToNextLevel,
  calculateLevel,
} from "@/lib/xp";

describe("calculateXpGain", () => {
  it("loss always returns 30", () => {
    expect(calculateXpGain(70, 80, false)).toBe(30);
    expect(calculateXpGain(99, 50, false)).toBe(30);
  });

  it("win vs equal rating → 80", () => {
    expect(calculateXpGain(70, 70, true)).toBe(80);
  });

  it("win vs stronger opponent → bonus XP", () => {
    const xp = calculateXpGain(60, 80, true);
    expect(xp).toBeGreaterThan(80);
  });

  it("win vs weaker opponent → base XP (80)", () => {
    const xp = calculateXpGain(80, 60, true);
    expect(xp).toBe(80);
  });

  it("win XP never exceeds 200", () => {
    expect(calculateXpGain(50, 99, true)).toBeLessThanOrEqual(200);
  });

  it("win XP never below 80", () => {
    expect(calculateXpGain(99, 50, true)).toBeGreaterThanOrEqual(80);
  });
});

describe("xpForLevel", () => {
  it("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("level 2 requires more than 0 XP", () => {
    expect(xpForLevel(2)).toBeGreaterThan(0);
  });

  it("XP requirements increase with level", () => {
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(5));
    expect(xpForLevel(20)).toBeGreaterThan(xpForLevel(10));
  });
});

describe("xpToNextLevel", () => {
  it("returns 0 at max level (50)", () => {
    expect(xpToNextLevel(50)).toBe(0);
  });

  it("returns positive value below max level", () => {
    expect(xpToNextLevel(1)).toBeGreaterThan(0);
    expect(xpToNextLevel(25)).toBeGreaterThan(0);
  });

  it("xpToNextLevel increases with level", () => {
    expect(xpToNextLevel(10)).toBeGreaterThan(xpToNextLevel(5));
  });
});

describe("calculateLevel", () => {
  it("0 XP → level 1", () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpToNextLevel).toBeGreaterThan(0);
  });

  it("returns object with level, xpIntoLevel, xpToNextLevel", () => {
    const result = calculateLevel(1000);
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("xpIntoLevel");
    expect(result).toHaveProperty("xpToNextLevel");
  });

  it("enough XP to reach level 2", () => {
    const needed = xpForLevel(2);
    const result = calculateLevel(needed);
    expect(result.level).toBeGreaterThanOrEqual(2);
  });

  it("xpIntoLevel is XP beyond current level threshold", () => {
    const needed = xpForLevel(2);
    const extra  = 100;
    const result = calculateLevel(needed + extra);
    expect(result.xpIntoLevel).toBe(extra);
  });

  it("very large XP → max level 50", () => {
    const result = calculateLevel(999_999_999);
    expect(result.level).toBe(50);
    expect(result.xpToNextLevel).toBe(0);
  });

  it("level increases monotonically with XP", () => {
    const r1 = calculateLevel(0);
    const r2 = calculateLevel(5000);
    const r3 = calculateLevel(50000);
    expect(r2.level).toBeGreaterThanOrEqual(r1.level);
    expect(r3.level).toBeGreaterThanOrEqual(r2.level);
  });
});
