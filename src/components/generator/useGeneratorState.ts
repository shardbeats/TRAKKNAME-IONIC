/**
 * All Generator form state in one hook — the page stays a thin composition
 * of LanguageSegment + OptionsPanel + MoodsPanel + ArtistsPanel + ResultCard.
 */
import { useEffect, useMemo, useState } from "react";
import type { MemoryDb } from "../../lib/db/memory";
import { selectArtists } from "../../lib/engine/engine";
import { mathRng } from "../../lib/engine/weighted_random";
import type { GenerationResult } from "../../lib/engine/types";
import { GenerationService } from "../../lib/services/generation";
import type { SettingsService } from "../../lib/services/settings";
import { MAX_MOODS } from "./MoodsPanel";

export function useGeneratorState(
  db: MemoryDb,
  settings: SettingsService,
  service: GenerationService,
) {
  const [genre, setGenre] = useState(settings.get("default_genre"));
  const [language, setLanguage] = useState(settings.get("default_language"));
  const [artistCount, setArtistCount] = useState(settings.get("artists_per_generation"));
  const [style, setStyle] = useState(settings.get("default_style"));
  const [moodsOpen, setMoodsOpen] = useState(false);
  const [moodSearch, setMoodSearch] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([...settings.get("selected_moods")]);
  const [artistPool, setArtistPool] = useState<string>(settings.get("artist_pool"));
  const [singleWord, setSingleWord] = useState(settings.get("single_word"));
  const [influence, setInfluence] = useState(Number(settings.get("artist_influence") ?? 0.5));
  const [useVerbs, setUseVerbs] = useState(settings.get("use_verbs"));
  const [useAdj, setUseAdj] = useState(settings.get("use_adjectives"));
  const [useNouns, setUseNouns] = useState(settings.get("use_nouns"));
  const [chips, setChips] = useState<string[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const genres = db.listGenres().filter((g) => g.enabled === 1);
  const allMoods = db.listMoods().filter((m) => m.enabled === 1);
  const moods = allMoods.filter(
    (m) => !moodSearch || m.name.toLowerCase().includes(moodSearch.toLowerCase()),
  );
  // Single-word titles live ONLY in the 1-WORD toggle: lone-NOUN templates
  // never appear in the style list (guard against user-imported patterns too).
  const styles = useMemo(() => {
    const names = db
      .listPatterns(language)
      .filter((p) => p.enabled === 1 && p.template.trim().toUpperCase() !== "NOUN")
      .map((p) => p.name);
    return ["Random", ...Array.from(new Set(names))];
  }, [db, language]);

  // Guard: a persisted/legacy style may no longer exist in the list.
  useEffect(() => {
    if (!styles.includes(style)) setStyle("Random");
  }, [styles, style]);

  const persistPrefs = () => {
    settings.set("default_genre", genre);
    settings.set("default_language", language);
    settings.set("artists_per_generation", artistCount);
    settings.set("default_style", style);
    settings.set("selected_moods", selectedMoods);
    settings.set("artist_pool", artistPool as never);
    settings.set("single_word", singleWord);
    settings.set("artist_influence", influence);
    settings.set("use_verbs", useVerbs);
    settings.set("use_adjectives", useAdj);
    settings.set("use_nouns", useNouns);
  };

  // Artist preview (desktop _preview_artists): weighted pick, no history save.
  useEffect(() => {
    const grow = db.getGenreByName(genre);
    if (!grow) {
      setChips([]);
      return;
    }
    setChips(selectArtists(db, grow.id, artistCount, mathRng, artistPool));
  }, [db, genre, artistCount, artistPool, language]);

  const doGenerate = () => {
    persistPrefs();
    setError(null);
    try {
      const r = service.generate({
        genre,
        language,
        artistCount,
        // 1-WORD on: style is irrelevant, engine renders a lone noun.
        style: singleWord ? "Random" : style,
        singleWord,
        moods: selectedMoods,
        artistPool,
      });
      setResult(r);
      setChips([...r.artists]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const rerollArtists = () => {
    const grow = db.getGenreByName(genre);
    if (!grow) return;
    const names = selectArtists(db, grow.id, artistCount, mathRng, artistPool);
    setChips(names);
    if (result) setResult({ ...result, artists: names });
  };

  // Desktop FIFO: a 3rd mood replaces the oldest instead of being blocked.
  const toggleMood = (name: string) => {
    const next = selectedMoods.includes(name)
      ? selectedMoods.filter((m) => m !== name)
      : [...selectedMoods, name].slice(-MAX_MOODS);
    setSelectedMoods(next);
    settings.set("selected_moods", next);
  };

  const clearMoods = () => {
    setSelectedMoods([]);
    settings.set("selected_moods", []);
  };

  const toggleSingle = () => {
    const next = !singleWord;
    setSingleWord(next);
    settings.set("single_word", next);
  };

  const changeLanguage = (v: "en" | "es") => {
    setLanguage(v);
    setStyle("Random");
    // Pool follows language (desktop _on_language_changed); user can override after.
    setArtistPool(v);
  };

  const changeInfluence = (v: number) => {
    setInfluence(v);
    settings.set("artist_influence", v);
  };

  const changeWords = (key: "use_verbs" | "use_adjectives" | "use_nouns", v: boolean) => {
    if (key === "use_verbs") setUseVerbs(v);
    if (key === "use_adjectives") setUseAdj(v);
    if (key === "use_nouns") setUseNouns(v);
    settings.set(key, v);
  };

  return {
    // state
    genre, setGenre,
    language, artistCount, setArtistCount, style, setStyle,
    moodsOpen, setMoodsOpen, moodSearch, setMoodSearch,
    selectedMoods, artistPool, setArtistPool,
    singleWord, influence, useVerbs, useAdj, useNouns,
    chips, result, error,
    // derived
    genres, moods, styles,
    // actions
    changeLanguage, doGenerate, rerollArtists,
    toggleMood, clearMoods, toggleSingle, changeInfluence, changeWords,
  };
}

export type GeneratorState = ReturnType<typeof useGeneratorState>;
