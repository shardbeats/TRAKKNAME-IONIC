/** Domain rows — mirrors SQLite schema + seed-json shape. */

export type Language = "en" | "es";
export type Pos = "verb" | "adjective" | "noun";
export type ArtistPool = "all" | "es" | "en";

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

/** One weighted word candidate inside a pool. */
export interface PoolEntry {
  word: string;
  gender: string | null;
  number: string | null;
  weight: number;
}
