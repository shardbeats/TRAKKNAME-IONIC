/** Desktop meta line: "Genre · LanguageLabel [+ moods]" + artists row. */
import { LANGUAGE_LABELS, poolEmptyText, type GenerationResult } from "../../lib/engine/types";

export function buildMetaHead(
  result: GenerationResult | null,
  fallbackGenre: string,
  fallbackLanguage: string,
): string {
  if (result) {
    return (
      `${result.genreName} · ${LANGUAGE_LABELS[result.language] ?? result.language}` +
      (result.moods.length > 0 ? ` · ${result.moods.join(" + ")}` : "")
    );
  }
  return `${fallbackGenre} · ${LANGUAGE_LABELS[fallbackLanguage] ?? fallbackLanguage}`;
}

export function buildMetaArtists(chips: string[], artistPool: string): string {
  return chips.length > 0 ? chips.join(" × ") : poolEmptyText(artistPool);
}
