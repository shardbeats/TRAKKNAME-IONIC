import { describe, expect, it } from "vitest";
import { loadSeedDb } from "../lib/db/seed";
import { generateTitle, GenerationError } from "../lib/engine/engine";
import { SeededRng } from "../lib/engine/weighted_random";
import { normalizeTitle } from "../lib/engine/text";

describe("generator (port of test_generator.py)", () => {
  it("english generates", () => {
    const db = loadSeedDb();
    const r = generateTitle(db, { genreName: "Trap", language: "en", artistCount: 2, rng: new SeededRng(0), save: false });
    expect(r.title.trim().length).toBeGreaterThan(0);
  });
  it("spanish generates", () => {
    const db = loadSeedDb();
    const r = generateTitle(db, { genreName: "Trap", language: "es", artistCount: 2, rng: new SeededRng(0), save: false });
    expect(r.title.trim().length).toBeGreaterThan(0);
  });
  it("curated pattern set: 8 enabled, ES names in Spanish", () => {
    const db = loadSeedDb();
    const enabled = db.patterns.filter((p) => p.enabled === 1);
    expect(enabled.length).toBe(8);
    const esNames = db.patterns.filter((p) => p.language === "es").map((p) => p.name);
    for (const n of esNames.filter((n) => db.patterns.find((p) => p.name === n)?.enabled === 1)) {
      expect(n).not.toMatch(/\b(ADJ|NOUN|VERB)\b/);
      expect(n).not.toContain("(ES)");
    }
  });
  it("every enabled pattern family renders", () => {
    const db = loadSeedDb();
    for (const lang of ["en", "es"]) {
      const r = generateTitle(db, { genreName: "Trap", language: lang, artistCount: 1, style: "Random", rng: new SeededRng(3), save: false });
      expect(r.title.length).toBeGreaterThan(0);
    }
  });
  it("fallback with no artists", () => {
    const db = loadSeedDb();
    db.genres.push({ id: 999, name: "EmptyGenre", description: "", enabled: 1 });
    const r = generateTitle(db, { genreName: "EmptyGenre", language: "en", artistCount: 2, rng: new SeededRng(0), save: false });
    expect(r.artists).toEqual([]);
  });
  it("duplicate avoidance via recent", () => {
    const db = loadSeedDb();
    const r1 = generateTitle(db, { genreName: "Trap", language: "en", artistCount: 1, rng: new SeededRng(42), save: true });
    const r2 = generateTitle(db, { genreName: "Trap", language: "en", artistCount: 1, rng: new SeededRng(43), save: true });
    expect(normalizeTitle(r1.title)).not.toBe(normalizeTitle(r2.title + " DIFF"));
  });
  it("missing genre falls back", () => {
    const db = loadSeedDb();
    const r = generateTitle(db, { genreName: "Nope", language: "en", artistCount: 1, rng: new SeededRng(0), save: false });
    expect(r.title.trim().length).toBeGreaterThan(0);
  });
  it("single word renders one token", () => {
    const db = loadSeedDb();
    const r = generateTitle(db, { genreName: "Trap", language: "en", artistCount: 0, singleWord: true, rng: new SeededRng(7), save: false });
    expect(r.title.trim().split(/\s+/).length).toBe(1);
  });
  it("mood boost keeps working", () => {
    const db = loadSeedDb();
    const mood = db.moods.find((m) => m.enabled === 1)?.name;
    if (mood) {
      const r = generateTitle(db, { genreName: "Trap", language: "en", artistCount: 0, moods: [mood], rng: new SeededRng(1), save: false });
      expect(r.moods).toContain(mood);
    }
  });
  it("artist pool es only returns es artists", () => {
    const db = loadSeedDb();
    const r = generateTitle(db, { genreName: "Latin Trap", language: "es", artistCount: 2, artistPool: "es", rng: new SeededRng(2), save: false });
    for (const a of r.artists) {
      const row = db.artists.find((x) => x.name === a);
      expect(row?.language).toBe("es");
    }
  });
  it("throws when no patterns", () => {
    const db = loadSeedDb();
    db.patterns.forEach((p) => (p.enabled = 0));
    expect(() => generateTitle(db, { genreName: "Trap", language: "en", rng: new SeededRng(0), save: false })).toThrow(GenerationError);
  });
});
