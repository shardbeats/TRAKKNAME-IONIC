/**
 * JSON export/import — MemoryDb edition (and desktop-backup compatible).
 *
 * Export shape mirrors the desktop tables: genres, artists, artist_genres,
 * words, word_genres, patterns, genre_relations, moods, word_moods,
 * generation_history. Desktop backups import as-is (history rows with
 * artists_json/moods_json strings are converted); very old mobile exports
 * with genres embedded inside artists are also accepted.
 */
import type { MemoryDb } from "../db/memory";
import type {
  GenreRow,
  HistoryRow,
  MoodRow,
  PatternRow,
  WordGenreRow,
  WordMoodRow,
  WordRow,
} from "../engine/types";

export function exportDatabase(db: MemoryDb): string {
  const data = {
    genres: db.genres,
    artists: db.artists,
    artist_genres: db.artistGenres,
    words: db.words,
    word_genres: db.wordGenres,
    patterns: db.patterns,
    genre_relations: db.relations,
    moods: db.moods,
    word_moods: db.wordMoods,
    generation_history: db.history,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadText(filename: string, text: string, mime = "application/json"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

function upsert<T>(arr: T[], match: (x: T) => boolean, row: T): void {
  const ix = arr.findIndex(match);
  if (ix >= 0) arr[ix] = { ...arr[ix], ...row };
  else arr.push(row);
}

interface BackupPayload {
  genres?: GenreRow[];
  artists?: Array<{
    id: number;
    name: string;
    enabled?: number;
    region?: string | null;
    language?: string | null;
    genres?: Array<{ genre_id?: number; genre?: string; weight?: number }>;
  }>;
  artist_genres?: Array<{ artist_id: number; genre_id?: number; genre?: string; weight?: number }>;
  words?: WordRow[];
  word_genres?: WordGenreRow[];
  patterns?: PatternRow[];
  genre_relations?: Array<{ genre_id: number; related_genre_id?: number; related_genre?: string; weight?: number }>;
  moods?: MoodRow[];
  word_moods?: WordMoodRow[];
  generation_history?: Array<
    Omit<HistoryRow, "artists" | "moods"> & {
      artists?: string[];
      moods?: string[];
      artists_json?: string;
      moods_json?: string;
    }
  >;
}

function parseList(v: string[] | string | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Merge a backup into the db (INSERT OR REPLACE semantics). Caller confirms first. */
export function importDatabase(db: MemoryDb, jsonText: string): void {
  const payload = JSON.parse(jsonText) as BackupPayload;
  const genreIdByName = new Map(db.genres.map((g) => [g.name, g.id]));

  for (const g of payload.genres ?? []) {
    upsert(db.genres, (x) => x.id === g.id || x.name === g.name, {
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      enabled: g.enabled ?? 1,
    });
    genreIdByName.set(g.name, g.id);
  }
  const resolveGenre = (nameOrId: string | number | undefined): number | null => {
    if (typeof nameOrId === "number") return nameOrId;
    if (typeof nameOrId === "string") return genreIdByName.get(nameOrId) ?? null;
    return null;
  };

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
    const rid = gr.related_genre_id ?? resolveGenre(gr.related_genre);
    if (rid === null) continue;
    upsert(
      db.relations,
      (x) => x.genre_id === gr.genre_id && x.related_genre_id === rid,
      { genre_id: gr.genre_id, related_genre_id: rid },
    );
  }
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
