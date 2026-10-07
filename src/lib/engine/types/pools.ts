/** Artist-pool + language labels (UI text only, no DB logic). */
import type { ArtistPool } from "./domain";

export const LEGACY_POOL_MAP: Record<string, ArtistPool> = { latam: "es" };

export const LANGUAGE_LABELS: Record<string, string> = { en: "English", es: "Spanish" };

export const ARTIST_POOLS: Record<string, string> = {
  all: "All",
  es: "En español",
  en: "English",
};

export const POOL_EMPTY_TEXT: Record<string, string> = {
  all: "No artists configured for this genre.",
  es: "No Spanish-language artists for this genre.",
  en: "No English-language artists for this genre.",
  latam: "No Spanish-language artists for this genre.",
};

export function poolLabel(pool: string | null | undefined): string {
  const p = (LEGACY_POOL_MAP[pool ?? ""] ?? pool ?? "all") as string;
  return ARTIST_POOLS[p] ?? p;
}

export function poolEmptyText(pool: string | null | undefined): string {
  return POOL_EMPTY_TEXT[pool ?? ""] ?? POOL_EMPTY_TEXT.all;
}

export function normalizePool(pool: string | null | undefined): ArtistPool | null {
  if (!pool) return null;
  const mapped = LEGACY_POOL_MAP[pool] ?? pool;
  if (mapped === "es" || mapped === "en" || mapped === "all") return mapped;
  return "all";
}
