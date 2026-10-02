/** Seed loading from seed-json/ (bundled via JSON import). */
import { MemoryDb } from "./memory";
import genresJson from "../../../seed-json/genres.json";
import artistsJson from "../../../seed-json/artists.json";
import wordsJson from "../../../seed-json/words.json";
import moodsJson from "../../../seed-json/moods.json";
import patternsJson from "../../../seed-json/patterns.json";
import relationsJson from "../../../seed-json/genre_relations.json";

export function loadSeedDb(): MemoryDb {
  return MemoryDb.fromSeed({
    genres: genresJson as Array<{ name: string; description?: string; enabled?: number }>,
    artists: artistsJson as never,
    words: wordsJson as never,
    moods: moodsJson as never,
    patterns: patternsJson as never,
    genre_relations: relationsJson as never,
  });
}
