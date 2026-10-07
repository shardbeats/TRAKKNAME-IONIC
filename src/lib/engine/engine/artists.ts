/** Weighted artist sampling for a genre (desktop _preview_artists parity). */
import { normalizePool, type DbPort } from "../types";
import { sampleWeightedUnique, type Rng } from "../weighted_random";

export function selectArtists(
  db: DbPort,
  genreId: number | null,
  count: number,
  rng: Rng,
  pool: string | null = null,
): string[] {
  if (!genreId || count <= 0) return [];
  const norm = normalizePool(pool);
  const rows = db.getArtistsForGenre(genreId, norm);
  if (rows.length === 0) return [];
  const names = rows.map((r) => r.artist_name);
  const weights = rows.map((r) => Math.max(r.weight, 0));
  return sampleWeightedUnique(names, weights, Math.min(count, names.length), rng);
}
