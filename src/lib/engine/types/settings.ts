/** Settings shape + defaults (mirrors Python SettingsService). */
import type { ArtistPool, Language, Pos } from "./domain";

export interface SettingsData {
  default_language: Language;
  default_genre: string;
  artists_per_generation: number;
  recent_exclusion_count: number;
  w_genre: number;
  w_related: number;
  w_global: number;
  artist_influence: number;
  default_style: string;
  single_word: boolean;
  selected_moods: string[];
  artist_pool: ArtistPool;
  w_mood: number;
  use_verbs: boolean;
  use_adjectives: boolean;
  use_nouns: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  default_language: "en",
  default_genre: "Trap",
  artists_per_generation: 2,
  recent_exclusion_count: 100,
  w_genre: 0.7,
  w_related: 0.2,
  w_global: 0.1,
  artist_influence: 0.5,
  default_style: "Random",
  single_word: false,
  selected_moods: [],
  artist_pool: "all",
  w_mood: 1.0,
  use_verbs: true,
  use_adjectives: true,
  use_nouns: true,
};

export function allowedPosFromSettings(s: SettingsData): Set<Pos> {
  const allowed = new Set<Pos>();
  if (s.use_verbs) allowed.add("verb");
  if (s.use_adjectives) allowed.add("adjective");
  if (s.use_nouns) allowed.add("noun");
  if (allowed.size === 0) {
    allowed.add("verb");
    allowed.add("adjective");
    allowed.add("noun");
  }
  return allowed;
}
