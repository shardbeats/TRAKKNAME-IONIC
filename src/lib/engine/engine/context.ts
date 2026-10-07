/** Generation context: genre + artists + mood/artist boosts. */
import { normalizePool, type DbPort } from "../types";
import type { Rng } from "../weighted_random";
import { selectArtists } from "./artists";

export interface GenContext {
  genreId: number | null;
  genreLabel: string;
  language: string;
  artists: string[];
  relatedIds: number[];
  moodNames: string[];
  moodBoost: Map<number, number>;
  artistBoost: Map<number, number>;
  artistPool: string | null;
}

export function resolveContext(
  db: DbPort,
  genreName: string | null | undefined,
  language: string,
  artistCount: number,
  artistInfluence: number,
  moods: string[] | null | undefined,
  artistPool: string | null | undefined,
  rng: Rng,
): GenContext {
  const lang = language === "en" || language === "es" ? language : "en";
  let grow = genreName ? db.getGenreByName(genreName) : null;
  if (genreName && !grow) grow = db.getFirstEnabledGenre();
  const genreId = grow ? grow.id : null;
  const genreLabel = grow ? grow.name : genreName || "Unknown";

  const pool = normalizePool(artistPool ?? null);
  const artists = selectArtists(db, genreId, artistCount, rng, pool);
  const related = genreId ? db.getRelatedIds(genreId) : [];
  const requested = (moods ?? []).map((m) => m.trim()).filter(Boolean).slice(0, 2);
  const moodIds = db.moodIdsForNames(requested);
  const moodNames =
    moodIds.length > 0
      ? db
          .listMoods()
          .filter((m) => moodIds.includes(m.id))
          .map((m) => m.name)
      : [];
  const moodBoost = moodIds.length > 0 ? db.moodWordWeights(moodIds) : new Map<number, number>();
  const artistBoost = resolveArtistBoost(db, artists, genreId, artistInfluence);
  return {
    genreId,
    genreLabel,
    language: lang,
    artists,
    relatedIds: related,
    moodNames,
    moodBoost,
    artistBoost,
    artistPool: pool,
  };
}

function resolveArtistBoost(
  db: DbPort,
  artists: string[],
  genreId: number | null,
  artistInfluence: number,
): Map<number, number> {
  const boost = new Map<number, number>();
  if (!(artists.length > 0 && artistInfluence > 0 && genreId)) return boost;
  const factor = 1.0 + artistInfluence * 0.5;
  for (const aname of artists) {
    const others = db.getArtistGenresOther(aname, genreId);
    if (others.length === 0) continue;
    const ids = db.wordIdsForGenreIds(others);
    for (const wid of ids.keys()) boost.set(wid, factor);
  }
  return boost;
}
