/** Backup payload shapes + tiny merge helpers (shared by export/import). */
import type {
  GenreRow,
  HistoryRow,
  MoodRow,
  PatternRow,
  WordGenreRow,
  WordMoodRow,
  WordRow,
} from "../../engine/types";

export interface BackupPayload {
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

export function upsert<T>(arr: T[], match: (x: T) => boolean, row: T): void {
  const ix = arr.findIndex(match);
  if (ix >= 0) arr[ix] = { ...arr[ix], ...row };
  else arr.push(row);
}

export function parseList(v: string[] | string | undefined): string[] {
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
