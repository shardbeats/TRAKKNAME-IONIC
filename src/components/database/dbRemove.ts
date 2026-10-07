/** Cascading deletes — one small branch per section (was removeRow inline). */
import type { MemoryDb } from "../../lib/db/memory";

export type DbSection = "genres" | "words" | "artists" | "patterns" | "moods";

export function deleteRow(db: MemoryDb, kind: DbSection, id: number): void {
  if (kind === "genres") {
    db.genres = db.genres.filter((g) => g.id !== id);
    db.artistGenres = db.artistGenres.filter((ag) => ag.genre_id !== id);
    db.wordGenres = db.wordGenres.filter((wg) => wg.genre_id !== id);
    db.relations = db.relations.filter((r) => r.genre_id !== id && r.related_genre_id !== id);
  } else if (kind === "artists") {
    db.artists = db.artists.filter((a) => a.id !== id);
    db.artistGenres = db.artistGenres.filter((ag) => ag.artist_id !== id);
  } else if (kind === "words") {
    db.words = db.words.filter((w) => w.id !== id);
    db.wordGenres = db.wordGenres.filter((wg) => wg.word_id !== id);
    db.wordMoods = db.wordMoods.filter((wm) => wm.word_id !== id);
  } else if (kind === "patterns") {
    db.patterns = db.patterns.filter((p) => p.id !== id);
  } else {
    db.moods = db.moods.filter((m) => m.id !== id);
    db.wordMoods = db.wordMoods.filter((wm) => wm.mood_id !== id);
  }
}
