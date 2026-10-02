/** Weighted random selection with zero-weight handling — port of app/generator/weighted_random.py */

export interface Rng {
  next(): number; // [0,1)
  choice<T>(items: T[]): T;
}

function validateWeights(weights: number[]): void {
  for (const w of weights) {
    if (w < 0) throw new Error("Weights must be >= 0.");
  }
}

/** Seeded RNG (mulberry32). Equivalent role to random.Random in Python. */
export class SeededRng implements Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  choice<T>(items: T[]): T {
    if (items.length === 0) throw new Error("No items to choose from.");
    return items[Math.floor(this.next() * items.length)];
  }
}

/** Math.random-backed RNG (default for UI). */
export const mathRng: Rng = {
  next: () => Math.random(),
  choice: <T>(items: T[]): T => {
    if (items.length === 0) throw new Error("No items to choose from.");
    return items[Math.floor(Math.random() * items.length)];
  },
};

export function chooseWeighted<T>(items: T[], weights: number[], rng: Rng = mathRng): T {
  if (items.length === 0) throw new Error("No items to choose from.");
  validateWeights(weights);
  if (weights.every((w) => w <= 0)) return rng.choice(items);
  let total = 0;
  for (const w of weights) total += w;
  let r = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

export function sampleWeightedUnique<T>(
  items: T[],
  weights: number[],
  k: number,
  rng: Rng = mathRng,
): T[] {
  validateWeights(weights);
  let pool: Array<[T, number]> = items
    .map((it, i): [T, number] => [it, weights[i] ?? 0])
    .filter(([, w]) => w > 0);
  if (pool.length === 0) pool = items.map((it): [T, number] => [it, 1.0]);
  k = Math.min(k, pool.length);
  const out: T[] = [];
  pool = [...pool];
  for (let n = 0; n < k; n++) {
    const its = pool.map((p) => p[0]);
    const wts = pool.map((p) => p[1]);
    const pick = chooseWeighted(its, wts, rng);
    out.push(pick);
    pool = pool.filter(([it]) => it !== pick);
  }
  return out;
}
