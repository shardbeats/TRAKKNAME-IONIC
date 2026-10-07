/** One small importer per table — each is INSERT OR REPLACE by id/name. */
import type { MemoryDb } from "../../db/memory";
import { parseList, upsert, type BackupPayload } from "./payload";

export type GenreResolver = (nameOrId: string | number | undefined) => number | null;

export function importGenres(db: MemoryDb, payload: BackupPayload, genreIdByName: Map<string, number>): void {
  for (const g of payload.genres ?? []) {
    upsert(db.genres, (x) => x.id === g.id || x.name === g.name, {
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      enabled: g.enabled ?? 1,
    });
    genreIdByName.set(g.name, g.id);
  }
}

export function importArtists(db: MemoryDb, payload: BackupPayload, resolveGenre: GenreResolver): void {
  for (const a of payload.artists ?? []) {
    upsert(db.artists, (x) => x.id === a.id || x.name === a.name, {
      id: a.id,
      name: a.name,
      enabled: a.enabled ?? 1,
      region: a.region ?? null,
      language: a.language ?? null,
    });
    // Legacy shape: genre links embedded inside the artist row.
    for (const l of a.genres ?? []) {
      const gid = l.genre_id ?? resolveGenre(l.genre);
      if (gid === null) continue;
      upsert(
        db.artistGenres,
        (x) => x.artist_id === a.id && x.genre_id === gid,
        { artist_id: a.id, genre_id: gid, weight: l.weight ?? 1 },
      );
    }
  }
  for (const ag of payload.artist_genres ?? []) {
    const gid = ag.genre_id ?? resolveGenre(ag.genre);
    if (gid === null) continue;
    upsert(
      db.artistGenres,
      (x) => x.artist_id === ag.artist_id && x.genre_id === gid,
      { artist_id: ag.artist_id, genre_id: gid, weight: ag.weight ?? 1 },
    );
  }
}

export function importWords(db: MemoryDb, payload: BackupPayload): void {
  for (const w of payload.words ?? []) {
    upsert(db.words, (x) => x.id === w.id, {
      id: w.id,
      word: w.word,
      language: w.language,
      part_of_speech: w.part_of_speech,
      weight: w.weight ?? 1,
      enabled: w.enabled ?? 1,
      gender: w.gender ?? null,
      number: w.number ?? null,
    });
  }
  for (const wg of payload.word_genres ?? []) {
    upsert(
      db.wordGenres,
      (x) => x.word_id === wg.word_id && x.genre_id === wg.genre_id,
      { word_id: wg.word_id, genre_id: wg.genre_id, weight: wg.weight ?? 1 },
    );
  }
}

export function importPatterns(db: MemoryDb, payload: BackupPayload): void {
  for (const p of payload.patterns ?? []) {
    upsert(db.patterns, (x) => x.id === p.id, {
      id: p.id,
      name: p.name,
      language: p.language,
      template: p.template,
      weight: p.weight ?? 1,
      enabled: p.enabled ?? 1,
    });
  }
  for (const gr of payload.genre_relations ?? []) {
    const rid = gr.related_genre_id;
    if (rid === undefined || rid === null) continue;
    upsert(
      db.relations,
      (x) => x.genre_id === gr.genre_id && x.related_genre_id === rid,
      { genre_id: gr.genre_id, related_genre_id: rid },
    );
  }
}

/** genre_relations may also arrive with names instead of ids (desktop backups). */
export function importRelationsByName(
  db: MemoryDb,
  payload: BackupPayload,
  resolveGenre: GenreResolver,
): void {
  for (const gr of payload.genre_relations ?? []) {
    if (gr.related_genre_id !== undefined && gr.related_genre_id !== null) continue;
    const rid = resolveGenre(gr.related_genre);
    if (rid === null) continue;
    upsert(
      db.relations,
      (x) => x.genre_id === gr.genre_id && x.related_genre_id === rid,
      { genre_id: gr.genre_id, related_genre_id: rid },
    );
  }
}

export function importMoods(db: MemoryDb, payload: BackupPayload): void {
  for (const m of payload.moods ?? []) {
    upsert(db.moods, (x) => x.id === m.id || x.name === m.name, {
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      icon: m.icon ?? "",
      enabled: m.enabled ?? 1,
    });
  }
  for (const wm of payload.word_moods ?? []) {
    upsert(
      db.wordMoods,
      (x) => x.word_id === wm.word_id && x.mood_id === wm.mood_id,
      { word_id: wm.word_id, mood_id: wm.mood_id, weight: wm.weight ?? 1 },
    );
  }
}

export function importHistory(db: MemoryDb, payload: BackupPayload): void {
  for (const h of payload.generation_history ?? []) {
    upsert(db.history, (x) => x.id === h.id, {
      id: h.id,
      title: h.title,
      genre_id: h.genre_id ?? null,
      language: h.language ?? "en",
      artists: parseList(h.artists ?? h.artists_json),
      pattern: h.pattern ?? "",
      created_at: h.created_at ?? new Date().toISOString(),
      moods: parseList(h.moods ?? h.moods_json),
      artist_pool: h.artist_pool ?? "all",
    });
  }
  db.resequenceHistory();
}
