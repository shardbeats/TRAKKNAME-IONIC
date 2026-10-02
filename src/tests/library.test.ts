import { describe, expect, it } from "vitest";
import { loadSeedDb } from "../lib/db/seed";
import { exportDatabase, importDatabase } from "../lib/services/library";

describe("library export/import roundtrip", () => {
  it("preserves all tables including links and history", () => {
    const src = loadSeedDb();
    src.saveHistory({
      title: "Midnight Dreams",
      genre_id: 1,
      language: "en",
      artists: ["Metro Boomin"],
      pattern: "Adj + Noun",
      moods: [],
      artist_pool: "all",
    });
    const json = exportDatabase(src);
    const dst = loadSeedDb();
    dst.words = [];
    dst.artistGenres = [];
    importDatabase(dst, json);
    expect(dst.words.length).toBe(src.words.length);
    expect(dst.words.length).toBeGreaterThan(0);
    expect(dst.artists.length).toBe(src.artists.length);
    expect(dst.artistGenres.length).toBe(src.artistGenres.length);
    expect(dst.wordGenres.length).toBe(src.wordGenres.length);
    expect(dst.relations.length).toBe(src.relations.length);
    expect(dst.history.some((h) => h.title === "Midnight Dreams")).toBe(true);
  });

  it("imports desktop backups (artists_json/moods_json strings)", () => {
    const dst = loadSeedDb();
    importDatabase(
      dst,
      JSON.stringify({
        genres: [{ id: 900, name: "TestGenre", description: "", enabled: 1 }],
        generation_history: [
          {
            id: 900,
            title: "Neon Sombra",
            genre_id: 900,
            language: "es",
            artists_json: '["Yung Beef"]',
            pattern: "NOUN ADJ",
            created_at: "2026-01-01T00:00:00",
            moods_json: '["Dark"]',
            artist_pool: "es",
          },
        ],
      }),
    );
    const row = dst.history.find((h) => h.id === 900);
    expect(row?.artists).toEqual(["Yung Beef"]);
    expect(row?.moods).toEqual(["Dark"]);
  });

  it("resequenceHistory prevents id collisions after import", () => {
    const dst = loadSeedDb();
    importDatabase(
      dst,
      JSON.stringify({
        generation_history: [
          {
            id: 5000,
            title: "Old Title",
            genre_id: null,
            language: "en",
            artists: [],
            pattern: "",
            created_at: "2026-01-01T00:00:00",
            moods: [],
            artist_pool: "all",
          },
        ],
      }),
    );
    const saved = dst.saveHistory({
      title: "New Title",
      genre_id: null,
      language: "en",
      artists: [],
      pattern: "",
      moods: [],
      artist_pool: "all",
    });
    expect(saved.id).toBeGreaterThan(5000);
  });
});
