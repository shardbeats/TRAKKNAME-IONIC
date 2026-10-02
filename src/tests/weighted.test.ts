import { describe, expect, it } from "vitest";
import { SeededRng, chooseWeighted, sampleWeightedUnique } from "../lib/engine/weighted_random";

describe("weighted_random (port of test_weighted_random.py)", () => {
  it("zero weight never selected", () => {
    const rng = new SeededRng(0);
    for (let i = 0; i < 50; i++) {
      expect(chooseWeighted(["a", "b"], [0, 1], rng)).toBe("b");
    }
  });
  it("all zero falls back to uniform", () => {
    const rng = new SeededRng(0);
    expect(["a", "b"]).toContain(chooseWeighted(["a", "b"], [0, 0], rng));
  });
  it("negative raises", () => {
    expect(() => chooseWeighted(["a"], [-1])).toThrow();
  });
  it("no duplicates", () => {
    const rng = new SeededRng(1);
    const out = sampleWeightedUnique(["a", "b", "c"], [5, 1, 1], 3, rng);
    expect(new Set(out).size).toBe(3);
  });
  it("fewer available caps k", () => {
    const out = sampleWeightedUnique(["a", "b"], [1, 1], 5, new SeededRng(0));
    expect(out.length).toBe(2);
  });
});
