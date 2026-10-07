/** Merge a backup into the db (INSERT OR REPLACE semantics). Caller confirms first. */
import type { MemoryDb } from "../../db/memory";
import {
  importArtists,
  importGenres,
  importHistory,
  importMoods,
  importPatterns,
  importRelationsByName,
  importWords,
} from "./importers";
import type { BackupPayload } from "./payload";

export function importDatabase(db: MemoryDb, jsonText: string): void {
  const payload = JSON.parse(jsonText) as BackupPayload;
  const genreIdByName = new Map(db.genres.map((g) => [g.name, g.id]));

  importGenres(db, payload, genreIdByName);

  const resolveGenre = (nameOrId: string | number | undefined): number | null => {
    if (typeof nameOrId === "number") return nameOrId;
    if (typeof nameOrId === "string") return genreIdByName.get(nameOrId) ?? null;
    return null;
  };

  importArtists(db, payload, resolveGenre);
  importWords(db, payload);
  importPatterns(db, payload);
  importRelationsByName(db, payload, resolveGenre);
  importMoods(db, payload);
  importHistory(db, payload);
}
