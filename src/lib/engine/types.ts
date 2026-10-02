/** Shared domain types — mirrors SQLite schema + seed-json shape. */

export type Language = "en" | "es";
export type Pos = "verb" | "adjective" | "noun";
export type ArtistPool = "all" | "es" | "en";

export const LEGACY_POOL_MAP: Record<string, ArtistPool> = { latam: "es" };

export const LANGUAGE_LABELS: Record<string, string> = { en: "English", es: "Spanish" };

export const ARTIST_POOLS: Record<string, string> = {
  all: "All",
  es: "En español",
  en: "English",
};

export const POOL_EMPTY_TEXT: Record<string, string> = {
  all: "No artists configured for this genre.",
  es: "No Spanish-language artists for this genre.",
  en: "No English-language artists for this genre.",
  latam: "No Spanish-language artists for this genre.",
};

export function poolLabel(pool: string | null | undefined): string {
  const p = (LEGACY_POOL_MAP[pool ?? ""] ?? pool ?? "all") as string;
  return ARTIST_POOLS[p] ?? p;
}

export function poolEmptyText(pool: string | null | undefined): string {
  return POOL_EMPTY_TEXT[pool ?? ""] ?? POOL_EMPTY_TEXT.all;
}

export function normalizePool(pool: string | null | undefined): ArtistPool | null {
  if (!pool) return null;
  const mapped = LEGACY_POOL_MAP[pool] ?? pool;
  if (mapped === "es" || mapped === "en" || mapped === "all") return mapped;
  return "all";
}

export interface GenreRow {
  id: number;
  name: string;
  description: string;
  enabled: number;
}

export interface ArtistRow {
  id: number;
  name: string;
  enabled: number;
  region: string | null;
  language: string | null;
}

export interface ArtistGenreRow {
  artist_id: number;
  artist_name: string;
  genre_id: number;
  weight: number;
}

export interface WordRow {
  id: number;
  word: string;
  language: string;
  part_of_speech: Pos;
  weight: number;
  enabled: number;
  gender: string | null;
  number: string | null;
}

export interface WordGenreRow {
  word_id: number;
  genre_id: number;
  weight: number;
}

export interface WordMoodRow {
  word_id: number;
  mood_id: number;
  weight: number;
}

export interface PatternRow {
  id: number;
  name: string;
  language: string;
  template: string;
  weight: number;
  enabled: number;
}

export interface MoodRow {
  id: number;
  name: string;
  description: string;
  icon: string;
  enabled: number;
}

export interface HistoryRow {
  id: number;
  title: string;
  genre_id: number | null;
  genre_name?: string | null;
  language: string;
  artists: string[];
  pattern: string;
  created_at: string;
  moods: string[];
  artist_pool: string;
}

/** Seed-json shapes (keys by name, links embedded). */
export interface SeedWord {
  word: string;
  language: string;
  part_of_speech: string;
  weight: number;
  enabled: boolean | number;
  gender: string | null;
  number: string | null;
  genres: Array<{ genre: string; weight: number }>;
  moods: Array<{ mood: string; weight: number }>;
}

export interface SeedArtist {
  name: string;
  enabled: boolean | number;
  region: string | null;
  language: string | null;
  genres: Array<{ genre: string; weight: number }>;
}

export interface GenerationResult {
  title: string;
  genreName: string;
  genreId: number | null;
  language: string;
  artists: string[];
  patternName: string;
  patternTemplate: string;
  moods: string[];
}

export interface SettingsData {
  default_language: Language;
  default_genre: string;
  artists_per_generation: number;
  recent_exclusion_count: number;
  w_genre: number;
  w_related: number;
  w_global: number;
  artist_influence: number;
  default_style: string;
  single_word: boolean;
  selected_moods: string[];
  artist_pool: ArtistPool;
  w_mood: number;
  use_verbs: boolean;
  use_adjectives: boolean;
  use_nouns: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  default_language: "en",
  default_genre: "Trap",
  artists_per_generation: 2,
  recent_exclusion_count: 100,
  w_genre: 0.7,
  w_related: 0.2,
  w_global: 0.1,
  artist_influence: 0.5,
  default_style: "Random",
  single_word: false,
  selected_moods: [],
  artist_pool: "all",
  w_mood: 1.0,
  use_verbs: true,
  use_adjectives: true,
  use_nouns: true,
};

export function allowedPosFromSettings(s: SettingsData): Set<Pos> {
  const allowed = new Set<Pos>();
  if (s.use_verbs) allowed.add("verb");
  if (s.use_adjectives) allowed.add("adjective");
  if (s.use_nouns) allowed.add("noun");
  if (allowed.size === 0) {
    allowed.add("verb");
    allowed.add("adjective");
    allowed.add("noun");
  }
  return allowed;
}

/** One weighted word candidate inside a pool. */
export interface PoolEntry {
  word: string;
  gender: string | null;
  number: string | null;
  weight: number;
}

/**
 * Storage port used by the engine. Implemented by MemoryDb (bundled seed)
 * and, in the future, by the Capacitor SQLite adapter — the engine never
 * touches storage directly, only through this interface.
 */
export interface DbPort {
  getGenreByName(name: string): GenreRow | null;
  getFirstEnabledGenre(): GenreRow | null;
  getGenreById(id: number): GenreRow | null;
  listGenres(): GenreRow[];
  getArtistsForGenre(genreId: number, pool: string | null): ArtistGenreRow[];
  getArtistGenresOther(artistName: string, excludeGenreId: number): number[];
  wordIdsForGenreIds(genreIds: number[]): Map<number, number>;
  getRelatedIds(genreId: number): number[];
  moodIdsForNames(names: string[]): number[];
  moodWordWeights(moodIds: number[]): Map<number, number>;
  listMoods(): MoodRow[];
  listPatterns(language: string): PatternRow[];
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
  }): PoolEntry[];
  recentTitles(limit: number): Set<string>;
  saveHistory(row: Omit<HistoryRow, "id" | "created_at">): HistoryRow;
  resequenceHistory(): void;
  listHistory(limit: number, search?: string): HistoryRow[];
  deleteHistory(id: number): void;
  clearHistory(): void;
}
