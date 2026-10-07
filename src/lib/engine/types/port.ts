/**
 * Storage port used by the engine. Implemented by MemoryDb (bundled seed)
 * and, in the future, by the Capacitor SQLite adapter — the engine never
 * touches storage directly, only through this interface.
 */
import type {
  ArtistGenreRow,
  GenreRow,
  HistoryRow,
  MoodRow,
  PatternRow,
  PoolEntry,
  Pos,
} from "./domain";

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
