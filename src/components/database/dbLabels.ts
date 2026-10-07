/** Read-only label helpers for the Data tab (genre/artist/mood links). */
import type { MemoryDb } from "../../lib/db/memory";

export function genreName(db: MemoryDb, id: number): string {
  return db.genres.find((g) => g.id === id)?.name ?? "?";
}

export function artistLinks(db: MemoryDb, artistId: number): string {
  return db.artistGenres
    .filter((ag) => ag.artist_id === artistId)
    .map((ag) => `${genreName(db, ag.genre_id)} (${ag.weight})`)
    .join(", ");
}

export function wordGenreNames(db: MemoryDb, wordId: number): string {
  const names = db.wordGenres
    .filter((wg) => wg.word_id === wordId)
    .map((wg) => genreName(db, wg.genre_id));
  return names.length > 0 ? names.join(", ") : "global";
}

export function moodWordCount(db: MemoryDb, moodId: number): number {
  return db.wordMoods.filter((wm) => wm.mood_id === moodId).length;
}
