import { describe, it, expect } from "vitest";
import {
  calculateGlobalRating,
  calculateAttributeGrowth,
  applyPrestigePoints,
  type AttributeSet,
} from "@/lib/attributes";

const BASE_ATTRS: AttributeSet = {
  attrAttack:      70,
  attrDefense:     70,
  attrVolley:      70,
  attrConsistency: 70,
  attrBandeja:     70,
  attrRemate:      70,
};

describe("calculateGlobalRating", () => {
  it("returns average of 6 attrs", () => {
    expect(calculateGlobalRating(BASE_ATTRS)).toBe(70);
  });

  it("rounds result", () => {
    const attrs = { ...BASE_ATTRS, attrAttack: 71 };
    const result = calculateGlobalRating(attrs);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("min attrs → 50", () => {
    const attrs: AttributeSet = {
      attrAttack: 50, attrDefense: 50, attrVolley: 50,
      attrConsistency: 50, attrBandeja: 50, attrRemate: 50,
    };
    expect(calculateGlobalRating(attrs)).toBe(50);
  });

  it("max attrs → 99", () => {
    const attrs: AttributeSet = {
      attrAttack: 99, attrDefense: 99, attrVolley: 99,
      attrConsistency: 99, attrBandeja: 99, attrRemate: 99,
    };
    expect(calculateGlobalRating(attrs)).toBe(99);
  });
});

describe("calculateAttributeGrowth", () => {
  // ELO 1800 → eloToGlobalRating ≈ 83, above base 70 → positive globalDiff
  it("win at high ELO improves attrs", () => {
    const result = calculateAttributeGrowth(BASE_ATTRS, 1800, true, 2, 0, 3);
    const newGlobal = calculateGlobalRating(result);
    expect(newGlobal).toBeGreaterThanOrEqual(70);
  });

  it("returns AttributeSet with all 6 keys", () => {
    const result = calculateAttributeGrowth(BASE_ATTRS, 1800, true, 2, 0, 3);
    expect(result).toHaveProperty("attrAttack");
    expect(result).toHaveProperty("attrDefense");
    expect(result).toHaveProperty("attrVolley");
    expect(result).toHaveProperty("attrConsistency");
    expect(result).toHaveProperty("attrBandeja");
    expect(result).toHaveProperty("attrRemate");
  });

  it("attrs never exceed 99", () => {
    const highAttrs: AttributeSet = {
      attrAttack: 98, attrDefense: 98, attrVolley: 98,
      attrConsistency: 98, attrBandeja: 98, attrRemate: 98,
    };
    const result = calculateAttributeGrowth(highAttrs, 2200, true, 2, 0, 3);
    for (const val of Object.values(result)) {
      expect(val).toBeLessThanOrEqual(99);
    }
  });

  it("attrs never drop below 50", () => {
    const lowAttrs: AttributeSet = {
      attrAttack: 51, attrDefense: 51, attrVolley: 51,
      attrConsistency: 51, attrBandeja: 51, attrRemate: 51,
    };
    const result = calculateAttributeGrowth(lowAttrs, 800, false, 0, 2, 3);
    for (const val of Object.values(result)) {
      expect(val).toBeGreaterThanOrEqual(50);
    }
  });

  it("beginner speed faster than veteran (≤5 vs >20 matches)", () => {
    const beginnerResult = calculateAttributeGrowth(BASE_ATTRS, 1800, true, 2, 0, 3);
    const veteranResult  = calculateAttributeGrowth(BASE_ATTRS, 1800, true, 2, 0, 25);
    const beginnerGlobal = calculateGlobalRating(beginnerResult);
    const veteranGlobal  = calculateGlobalRating(veteranResult);
    expect(beginnerGlobal).toBeGreaterThanOrEqual(veteranGlobal);
  });
});

describe("applyPrestigePoints", () => {
  it("1 prestige point adds 0.33 to attr (no rounding)", () => {
    const result = applyPrestigePoints(BASE_ATTRS, { attrAttack: 1 });
    expect(result.attrAttack).toBeCloseTo(70.33);
  });

  it("2 prestige points adds 0.66", () => {
    const result = applyPrestigePoints(BASE_ATTRS, { attrAttack: 2 });
    expect(result.attrAttack).toBeCloseTo(70.66);
  });

  it("does not modify unspecified attrs", () => {
    const result = applyPrestigePoints(BASE_ATTRS, { attrAttack: 3 });
    expect(result.attrDefense).toBe(70);
    expect(result.attrVolley).toBe(70);
    expect(result.attrConsistency).toBe(70);
    expect(result.attrBandeja).toBe(70);
    expect(result.attrRemate).toBe(70);
  });

  it("clamps at 99", () => {
    const highAttrs = { ...BASE_ATTRS, attrAttack: 98.9 };
    const result = applyPrestigePoints(highAttrs, { attrAttack: 10 });
    expect(result.attrAttack).toBe(99);
  });

  it("does not apply negative points", () => {
    const result = applyPrestigePoints(BASE_ATTRS, { attrAttack: -5 });
    expect(result.attrAttack).toBe(70);
  });

  it("does not mutate input", () => {
    const input = { ...BASE_ATTRS };
    applyPrestigePoints(input, { attrAttack: 5 });
    expect(input.attrAttack).toBe(70);
  });

  it("multiple attrs updated simultaneously", () => {
    const result = applyPrestigePoints(BASE_ATTRS, {
      attrAttack: 1,
      attrDefense: 2,
    });
    expect(result.attrAttack).toBeCloseTo(70.33);
    expect(result.attrDefense).toBeCloseTo(70.66);
  });
});
