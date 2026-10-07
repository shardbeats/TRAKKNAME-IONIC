/** Seed population for MemoryDb — extracted from MemoryDb.fromSeed (no queries here). */
import type { Pos, SeedArtist, SeedWord } from "../engine/types";
import type { MemoryDb } from "./memory";

export interface MemorySeed {
  genres: Array<{ name: string; description?: string; enabled?: number | boolean }>;
  artists: SeedArtist[];
  words: SeedWord[];
  moods: Array<{ name: string; description?: string; icon?: string; enabled?: number | boolean }>;
  patterns: Array<{
    name: string;
    language: string;
    template: string;
    weight?: number;
    enabled?: number | boolean;
  }>;
  genre_relations: Array<{ genre: string; related_genre: string; weight?: number }>;
}

const on = (v: number | boolean | undefined, dflt = 1) =>
  v === undefined ? dflt : v ? 1 : 0;

export function populateFromSeed(db: MemoryDb, seed: MemorySeed): void {
  seed.genres.forEach((g, i) => {
    db.genres.push({
      id: i + 1,
      name: g.name,
      description: g.description ?? "",
      enabled: on(g.enabled),
    });
  });
  const gid = (name: string) => db.genres.find((g) => g.name === name)?.id;
  seed.artists.forEach((a, i) => {
    const id = i + 1;
    db.artists.push({
      id,
      name: a.name,
      enabled: on(a.enabled),
      region: a.region ?? null,
      language: a.language ?? null,
    });
    for (const l of a.genres ?? []) {
      const g = gid(l.genre);
      if (g) db.artistGenres.push({ artist_id: id, genre_id: g, weight: l.weight ?? 1 });
    }
  });
  seed.words.forEach((w, i) => {
    const id = i + 1;
    db.words.push({
      id,
      word: w.word,
      language: w.language,
      part_of_speech: w.part_of_speech as Pos,
      weight: w.weight ?? 1,
      enabled: on(w.enabled),
      gender: w.gender ?? null,
      number: w.number ?? null,
    });
    for (const l of w.genres ?? []) {
      const g = gid(l.genre);
      if (g) db.wordGenres.push({ word_id: id, genre_id: g, weight: l.weight ?? 1 });
    }
  });
  // moods need ids before word_moods
  const moodId = new Map<string, number>();
  seed.moods.forEach((m, i) => {
    const id = i + 1;
    moodId.set(m.name, id);
    db.moods.push({
      id,
      name: m.name,
      description: m.description ?? "",
      icon: m.icon ?? "",
      enabled: on(m.enabled),
    });
  });
  seed.words.forEach((w, i) => {
    for (const l of w.moods ?? []) {
      const mid = moodId.get(l.mood);
      if (mid) db.wordMoods.push({ word_id: i + 1, mood_id: mid, weight: l.weight ?? 1 });
    }
  });
  seed.patterns.forEach((p, i) => {
    db.patterns.push({
      id: i + 1,
      name: p.name,
      language: p.language,
      template: p.template,
      weight: p.weight ?? 1,
      enabled: on(p.enabled),
    });
  });
  for (const r of seed.genre_relations ?? []) {
    const a = gid(r.genre);
    const b = gid(r.related_genre);
    if (a && b) db.relations.push({ genre_id: a, related_genre_id: b });
  }
}
