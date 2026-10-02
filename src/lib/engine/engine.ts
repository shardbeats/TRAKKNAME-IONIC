/** Title generation engine — port of app/generator/engine.py, DB-agnostic via DbPort. */
import { agreePair } from "./grammar";
import { parseTemplate } from "./templates";
import { normalizeTitle, titleCase } from "./text";
import { normalizePool, type DbPort, type GenerationResult, type PoolEntry, type Pos } from "./types";
import { chooseWeighted, sampleWeightedUnique, type Rng, mathRng } from "./weighted_random";

export class GenerationError extends Error {}

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

function pickWord(
  pool: PoolEntry[],
  rng: Rng,
): { word: string; gender: string | null; number: string | null } {
  if (pool.length === 0) throw new GenerationError("No words available in pool.");
  const idx = chooseWeighted(
    pool.map((_, i) => i),
    pool.map((p) => p.weight),
    rng,
  );
  const p = pool[idx];
  return { word: p.word, gender: p.gender, number: p.number };
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

export function pickPatterns(db: DbPort, language: string, style: string, singleWord: boolean) {
  if (singleWord) {
    const singles = db
      .listPatterns(language)
      .filter((r) => r.enabled === 1 && r.template.trim().toUpperCase() === "NOUN");
    if (singles.length > 0) return singles;
    return [{ id: 0, name: "Single word", language, template: "NOUN", weight: 1.0, enabled: 1 }];
  }
  if (style && style !== "Random") {
    const prows = db
      .listPatterns(language)
      .filter((r) => r.name === style && r.enabled === 1);
    if (prows.length > 0) return prows;
  }
  const prows = db.listPatterns(language).filter((r) => r.enabled === 1);
  if (prows.length === 0) throw new GenerationError("No generation patterns available.");
  return prows;
}

export function renderTitle(
  db: DbPort,
  ctx: GenContext,
  template: string,
  language: string,
  wGenre: number,
  wRelated: number,
  wGlobal: number,
  wMood: number,
  allowedPos: Set<string> | null,
  rng: Rng,
): string {
  const parts = parseTemplate(template);
  const needed = parts.filter((p) => p.kind === "slot").map((p) => (p as { value: Pos }).value);
  if (allowedPos !== null && needed.some((n) => !allowedPos.has(n))) {
    throw new GenerationError(`Template needs disabled word types: ${template}`);
  }
  const pools = new Map<string, PoolEntry[]>();
  for (const slot of new Set(needed)) {
    let pool = db.poolWords({
      language,
      pos: slot as Pos,
      genreId: ctx.genreId,
      relatedIds: ctx.relatedIds,
      wGenre,
      wRelated,
      wGlobal,
      allowedPos,
      artistBoost: ctx.artistBoost,
      moodBoost: ctx.moodBoost,
      wMood,
    });
    if (pool.length === 0) {
      pool = db.poolWords({
        language,
        pos: slot as Pos,
        genreId: null,
        relatedIds: [],
        wGenre: 0,
        wRelated: 0,
        wGlobal: 1.0,
        allowedPos,
        artistBoost: null,
        moodBoost: ctx.moodBoost,
        wMood,
      });
    }
    if (pool.length === 0) throw new GenerationError(`No enabled ${slot}s are available for this genre.`);
    pools.set(slot, pool);
  }
  type Piece =
    | { kind: "lit"; text: string }
    | { kind: "slot"; slot: string; word: string; gender: string | null; number: string | null };
  const pieces: Piece[] = [];
  for (const p of parts) {
    if (p.kind === "literal") pieces.push({ kind: "lit", text: p.value });
    else {
      const slot = (p as { value: string }).value;
      const m = pickWord(pools.get(slot)!, rng);
      pieces.push({ kind: "slot", slot, word: m.word, gender: m.gender, number: m.number });
    }
  }
  const nounMetas = pieces.filter(
    (x): x is Extract<Piece, { kind: "slot" }> => x.kind === "slot" && x.slot === "noun",
  );
  const firstNoun = nounMetas.length > 0 ? nounMetas[0] : null;
  const rendered: string[] = [];
  for (const pc of pieces) {
    if (pc.kind === "lit") rendered.push(pc.text);
    else {
      let w = pc.word;
      if (language === "es" && pc.slot === "adjective" && firstNoun) {
        [, w] = agreePair(firstNoun.word, w, (firstNoun.gender ?? null) as never, (firstNoun.number ?? null) as never);
      }
      rendered.push(w);
    }
  }
  return titleCase(rendered.join(" "), language);
}

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
