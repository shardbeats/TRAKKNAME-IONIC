/** High-level generation facade — port of app/services/generation_service.py */
import { generateTitle } from "../engine/engine";
import { allowedPosFromSettings, type GenerationResult } from "../engine/types";
import type { DbPort } from "../engine/types";
import type { SettingsService } from "./settings";
import { mathRng, type Rng } from "../engine/weighted_random";

export class GenerationService {
  private rng: Rng;
  constructor(
    private db: DbPort,
    private settings: SettingsService,
    rng?: Rng,
  ) {
    this.rng = rng ?? mathRng;
  }
  generate(opts: {
    genre?: string | null;
    language?: string | null;
    artistCount?: number | null;
    style?: string | null;
    save?: boolean;
    singleWord?: boolean | null;
    moods?: string[] | null;
    artistPool?: string | null;
  } = {}): GenerationResult {
    const s = this.settings.data;
    const language = opts.language ?? s.default_language;
    const genre = opts.genre ?? s.default_genre;
    const artistCount = opts.artistCount ?? s.artists_per_generation;
    const style = opts.style ?? s.default_style;
    const singleWord = opts.singleWord ?? s.single_word;
    const moods = opts.moods ?? [...s.selected_moods];
    const artistPool = opts.artistPool ?? s.artist_pool;
    return generateTitle(this.db, {
      genreName: genre,
      language,
      artistCount: Number(artistCount),
      style,
      wGenre: Number(s.w_genre),
      wRelated: Number(s.w_related),
      wGlobal: Number(s.w_global),
      artistInfluence: Number(s.artist_influence),
      allowedPos: allowedPosFromSettings(s),
      recentLimit: Number(s.recent_exclusion_count),
      rng: this.rng,
      save: opts.save ?? true,
      singleWord: Boolean(singleWord),
      moods,
      wMood: Number(s.w_mood),
      artistPool,
    });
  }
}
