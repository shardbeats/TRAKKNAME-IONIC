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
  SeedArtist,
  SeedWord,
  WordGenreRow,
  WordMoodRow,
  WordRow,
} from "../engine/types";
import { normalizeTitle } from "../engine/text";

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

  static fromSeed(seed: {
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
  }): MemoryDb {
    const db = new MemoryDb();
    const on = (v: number | boolean | undefined, dflt = 1) =>
      v === undefined ? dflt : v ? 1 : 0;
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
      let eff: number;
      if (opts.genreId !== null && opts.genreId !== undefined && wl.has(opts.genreId)) {
        eff = base * (wl.get(opts.genreId)! ) * opts.wGenre;
      } else if (relatedSet.size > 0 && [...wl.keys()].some((g) => relatedSet.has(g))) {
        eff = base * opts.wRelated;
      } else {
        eff = base * opts.wGlobal;
      }
      if (opts.artistBoost?.has(r.id)) eff *= opts.artistBoost.get(r.id)!;
      if (opts.moodBoost?.has(r.id) && opts.wMood > 0) {
        eff *= 1.0 + opts.wMood * opts.moodBoost.get(r.id)!;
      }
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
