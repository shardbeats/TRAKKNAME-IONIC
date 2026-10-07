/** Main entry: retry loop with recent-title exclusion + history save. */
import { normalizeTitle } from "../text";
import type { DbPort, GenerationResult } from "../types";
import { chooseWeighted, mathRng, type Rng } from "../weighted_random";
import { resolveContext } from "./context";
import { GenerationError } from "./errors";
import { pickPatterns } from "./patterns";
import { renderTitle } from "./render";

export { GenerationError } from "./errors";

export interface GenerateOptions {
  genreName?: string | null;
  language?: string;
  artistCount?: number;
  style?: string;
  wGenre?: number;
  wRelated?: number;
  wGlobal?: number;
  artistInfluence?: number;
  allowedPos?: Set<string> | null;
  recentLimit?: number;
  rng?: Rng;
  save?: boolean;
  singleWord?: boolean;
  moods?: string[] | null;
  wMood?: number;
  artistPool?: string | null;
}

export function generateTitle(db: DbPort, opts: GenerateOptions = {}): GenerationResult {
  const {
    genreName = null,
    language = "en",
    artistCount = 2,
    style = "Random",
    wGenre = 0.7,
    wRelated = 0.2,
    wGlobal = 0.1,
    artistInfluence = 0.5,
    allowedPos = null,
    recentLimit = 100,
    rng = mathRng,
    save = true,
    singleWord = false,
    moods = null,
    wMood = 1.0,
    artistPool = null,
  } = opts;
  const ctx = resolveContext(db, genreName, language, artistCount, artistInfluence, moods, artistPool, rng);
  const lang = ctx.language;
  const prows = pickPatterns(db, lang, style, singleWord);
  const recent = recentLimit > 0 ? db.recentTitles(recentLimit) : new Set<string>();
  let allowed: Set<string> | null = allowedPos;
  if (singleWord) {
    allowed = new Set(allowedPos ?? []);
    allowed.add("noun");
  }
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const prow = chooseWeighted(
      prows,
      prows.map((r) => Math.max(r.weight, 0)),
      rng,
    );
    try {
      const title = renderTitle(db, ctx, prow.template, lang, wGenre, wRelated, wGlobal, wMood, allowed, rng);
      if (recent.has(normalizeTitle(title))) continue;
      const res: GenerationResult = {
        title,
        genreName: ctx.genreLabel,
        genreId: ctx.genreId,
        language: lang,
        artists: ctx.artists,
        patternName: prow.name,
        patternTemplate: prow.template,
        moods: ctx.moodNames,
      };
      if (save) {
        db.saveHistory({
          title,
          genre_id: ctx.genreId,
          language: lang,
          artists: ctx.artists,
          pattern: prow.name,
          moods: ctx.moodNames,
          artist_pool: ctx.artistPool ?? "all",
        });
        recent.add(normalizeTitle(title));
      }
      return res;
    } catch (e) {
      lastErr = e as Error;
      continue;
    }
  }
  throw new GenerationError(lastErr?.message ?? "Unable to generate a title. No enabled words are available for this genre.");
}
