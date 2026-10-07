/**
 * In-memory database — same query semantics as the Python sqlite repos,
 * backed by seed-json for web + tests. The future Capacitor SQLite adapter
 * must implement the same DbPort interface.
 */
import type {
  ArtistGenreRow,
  ArtistRow,
  DbPort,
  GenreRow,
  HistoryRow,
  MoodRow,
  PatternRow,
  PoolEntry,
  Pos,
  WordGenreRow,
  WordMoodRow,
  WordRow,
} from "../engine/types";
import { normalizeTitle } from "../engine/text";
import { populateFromSeed, type MemorySeed } from "./memorySeed";
import { scoreWord } from "./memoryScore";

let nextId = 100000;

export class MemoryDb implements DbPort {
  genres: GenreRow[] = [];
  artists: ArtistRow[] = [];
  artistGenres: Array<{ artist_id: number; genre_id: number; weight: number }> = [];
  words: WordRow[] = [];
  wordGenres: WordGenreRow[] = [];
  wordMoods: WordMoodRow[] = [];
  patterns: PatternRow[] = [];
  moods: MoodRow[] = [];
  relations: Array<{ genre_id: number; related_genre_id: number }> = [];
  history: HistoryRow[] = [];
  private hid = 1;

  static fromSeed(seed: MemorySeed): MemoryDb {
    const db = new MemoryDb();
    populateFromSeed(db, seed);
    return db;
  }

  // ---- genres ----
  getGenreByName(name: string): GenreRow | null {
    return this.genres.find((g) => g.name === name) ?? null;
  }
  getFirstEnabledGenre(): GenreRow | null {
    const enabled = this.genres.filter((g) => g.enabled === 1).sort((a, b) => a.name.localeCompare(b.name));
    return enabled[0] ?? null;
  }
  getGenreById(id: number): GenreRow | null {
    return this.genres.find((g) => g.id === id) ?? null;
  }
  listGenres(): GenreRow[] {
    return [...this.genres].sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---- artists ----
  getArtistsForGenre(genreId: number, pool: string | null): ArtistGenreRow[] {
    const links = this.artistGenres.filter((ag) => ag.genre_id === genreId);
    const out: ArtistGenreRow[] = [];
    for (const l of links) {
      const a = this.artists.find((x) => x.id === l.artist_id);
      if (!a || a.enabled !== 1) continue;
      if (pool === "es" && a.language !== "es") continue;
      if (pool === "en" && (a.language ?? "en") !== "en") continue;
      out.push({
        artist_id: a.id,
        artist_name: a.name,
        genre_id: l.genre_id,
        weight: l.weight,
      });
    }
    out.sort((a, b) => b.weight - a.weight);
    return out;
  }

  getArtistGenresOther(artistName: string, excludeGenreId: number): number[] {
    const a = this.artists.find((x) => x.name === artistName);
    if (!a) return [];
    return this.artistGenres
      .filter((ag) => ag.artist_id === a.id && ag.genre_id !== excludeGenreId)
      .map((ag) => ag.genre_id);
  }

  wordIdsForGenreIds(genreIds: number[]): Map<number, number> {
    const set = new Set(genreIds);
    const out = new Map<number, number>();
    for (const wg of this.wordGenres) {
      if (set.has(wg.genre_id)) out.set(wg.word_id, 1);
    }
    return out;
  }

  getRelatedIds(genreId: number): number[] {
    return this.relations.filter((r) => r.genre_id === genreId).map((r) => r.related_genre_id);
  }

  // ---- moods ----
  moodIdsForNames(names: string[]): number[] {
    return this.moods
      .filter((m) => names.includes(m.name) && m.enabled === 1)
      .map((m) => m.id);
  }
  moodWordWeights(moodIds: number[]): Map<number, number> {
    const set = new Set(moodIds);
    const out = new Map<number, number>();
    for (const wm of this.wordMoods) {
      if (!set.has(wm.mood_id)) continue;
      const prev = out.get(wm.word_id) ?? 0;
      if (wm.weight > prev) out.set(wm.word_id, wm.weight);
    }
    return out;
  }
  listMoods(): MoodRow[] {
    return [...this.moods].sort((a, b) => a.name.localeCompare(b.name));
  }
  moodNameById(id: number): string | null {
    return this.moods.find((m) => m.id === id)?.name ?? null;
  }

  // ---- patterns ----
  listPatterns(language: string): PatternRow[] {
    return this.patterns
      .filter((p) => p.language === "any" || p.language === language)
      .sort((a, b) => b.weight - a.weight);
  }

  // ---- words ----
  poolWords(opts: {
    language: string;
    pos: Pos;
    genreId: number | null;
    relatedIds: number[];
    wGenre: number;
    wRelated: number;
    wGlobal: number;
    allowedPos: Set<string> | null;
    artistBoost: Map<number, number> | null;
    moodBoost: Map<number, number> | null;
    wMood: number;
  }): PoolEntry[] {
    if (opts.allowedPos && !opts.allowedPos.has(opts.pos)) return [];
    const rows = this.words.filter(
      (w) => w.language === opts.language && w.part_of_speech === opts.pos && w.enabled === 1,
    );
    if (rows.length === 0) return [];
    const links = new Map<number, Map<number, number>>();
    for (const wg of this.wordGenres) {
      let m = links.get(wg.word_id);
      if (!m) {
        m = new Map();
        links.set(wg.word_id, m);
      }
      m.set(wg.genre_id, wg.weight);
    }
    const relatedSet = new Set(opts.relatedIds ?? []);
    const out: PoolEntry[] = [];
    for (const r of rows) {
      const base = Math.max(r.weight, 0);
      const wl = links.get(r.id) ?? new Map<number, number>();
      const hasGenre = opts.genreId !== null && opts.genreId !== undefined && wl.has(opts.genreId);
      const eff = scoreWord({
        base,
        genreWeight: hasGenre ? wl.get(opts.genreId!)! : null,
        isRelated: relatedSet.size > 0 && [...wl.keys()].some((g) => relatedSet.has(g)),
        wGenre: opts.wGenre,
        wRelated: opts.wRelated,
        wGlobal: opts.wGlobal,
        artistFactor: opts.artistBoost?.get(r.id) ?? null,
        moodFactor: opts.moodBoost?.get(r.id) ?? null,
        wMood: opts.wMood,
      });
      if (eff <= 0) continue;
      out.push({ word: r.word, gender: r.gender, number: r.number, weight: eff });
    }
    return out;
  }

  // ---- history ----
  recentTitles(limit: number): Set<string> {
    return new Set(
      [...this.history]
        .sort((a, b) => b.id - a.id)
        .slice(0, limit)
        .map((h) => normalizeTitle(h.title)),
    );
  }
  saveHistory(row: Omit<HistoryRow, "id" | "created_at">): HistoryRow {
    const full: HistoryRow = {
      ...row,
      id: this.hid++,
      created_at: new Date().toISOString(),
    };
    this.history.push(full);
    return full;
  }

  /** Move the id counter past any imported rows so new saves never collide. */
  resequenceHistory(): void {
    const max = this.history.reduce((m, h) => Math.max(m, h.id), 0);
    if (max >= this.hid) this.hid = max + 1;
  }
  listHistory(limit: number, search = ""): HistoryRow[] {
    let rows = [...this.history].sort((a, b) => b.id - a.id);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((h) => h.title.toLowerCase().includes(s));
    }
    return rows.slice(0, limit).map((h) => ({
      ...h,
      genre_name: h.genre_id ? this.getGenreById(h.genre_id)?.name ?? null : null,
    }));
  }
  deleteHistory(id: number): void {
    this.history = this.history.filter((h) => h.id !== id);
  }
  clearHistory(): void {
    this.history = [];
  }

  nextTempId(): number {
    return nextId++;
  }
}
