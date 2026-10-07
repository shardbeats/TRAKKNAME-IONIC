/**
 * Pool weight scoring — pure function extracted from MemoryDb.poolWords.
 * genre hit → base*link*wGenre · related hit → base*wRelated · else base*wGlobal,
 * then artistBoost (×factor) and moodBoost (× 1+wMood*boost).
 */
export function scoreWord(opts: {
  base: number;
  genreWeight: number | null;
  isRelated: boolean;
  wGenre: number;
  wRelated: number;
  wGlobal: number;
  artistFactor: number | null;
  moodFactor: number | null;
  wMood: number;
}): number {
  let eff: number;
  if (opts.genreWeight !== null && opts.genreWeight !== undefined) {
    eff = opts.base * opts.genreWeight * opts.wGenre;
  } else if (opts.isRelated) {
    eff = opts.base * opts.wRelated;
  } else {
    eff = opts.base * opts.wGlobal;
  }
  if (opts.artistFactor !== null && opts.artistFactor !== undefined) eff *= opts.artistFactor;
  if (opts.moodFactor !== null && opts.moodFactor !== undefined && opts.wMood > 0) {
    eff *= 1.0 + opts.wMood * opts.moodFactor;
  }
  return eff;
}
