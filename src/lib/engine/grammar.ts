/** Minimal deterministic Spanish adjective agreement — port of app/generator/grammar.py */

export type Gender = "masculine" | "feminine" | "neutral" | null | undefined;
export type GramNumber = "singular" | "plural" | null | undefined;

export function agreeAdjective(
  adjective: string,
  gender: Gender,
  number: GramNumber,
): string {
  let adj = adjective.trim();
  if (!adj || !gender) return adj;
  const g = gender.toLowerCase();
  const n = (number ?? "singular").toLowerCase();
  const low = adj.toLowerCase();

  const matchNumber = (word: string): string => {
    if (n === "plural") {
      if (word.endsWith("s")) return word;
      if (/[áéíóú]$/i.test(word)) return word + "s";
      return word + "s";
    }
    if (low.endsWith("es") && word.length > 3) return word;
    if (word.endsWith("s") && !/(és|is|os|as)$/i.test(low)) return word;
    return word;
  };

  if (g === "feminine") {
    if (low.endsWith("o")) adj = adj.slice(0, -1) + "a";
    else if (low.endsWith("os") && n === "plural") adj = adj.slice(0, -2) + "as";
    else if (/(or|án|ón)$/i.test(low)) adj = adj + "a";
  }
  return matchNumber(adj);
}

export function agreePair(
  noun: string,
  adjective: string,
  gender: Gender,
  number: GramNumber,
): [string, string] {
  return [noun, agreeAdjective(adjective, gender, number)];
}
