/** Template rendering: pool resolution + ES adjective agreement + title case. */
import { agreePair } from "../grammar";
import { parseTemplate } from "../templates";
import { titleCase } from "../text";
import type { DbPort, PoolEntry, Pos } from "../types";
import { chooseWeighted, type Rng } from "../weighted_random";
import type { GenContext } from "./context";
import { GenerationError } from "./errors";

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
