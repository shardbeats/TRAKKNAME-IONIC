/** Pattern picking: single-word fallback, named style, or enabled pool. */
import { GenerationError } from "./errors";
import type { DbPort } from "../types";

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
