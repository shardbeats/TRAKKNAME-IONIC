import { useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { useDb } from "../lib/db/store";
import { GenerationService } from "../lib/services/generation";
import { getSettings } from "../lib/services/settings";
import {
  LANGUAGE_LABELS,
  poolEmptyText,
  type GenerationResult,
} from "../lib/engine/types";
import { selectArtists } from "../lib/engine/engine";
import { mathRng } from "../lib/engine/weighted_random";
import { OptionsPanel } from "../components/generator/OptionsPanel";
import { ArtistsPanel } from "../components/generator/ArtistsPanel";
import { MAX_MOODS, MoodsPanel } from "../components/generator/MoodsPanel";
import { ResultCard } from "../components/generator/ResultCard";

const Generator: React.FC = () => {
  const db = useDb();
  const settings = useMemo(() => getSettings(), []);
  const service = useMemo(() => new GenerationService(db, settings), [db, settings]);
  const [present] = useIonToast();

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

  const toast = (message: string) => present({ message, duration: 1400, position: "bottom" });

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

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${text} copied!`);
    } catch {
      toast("Copy not available");
    }
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

  // Desktop meta: "Genre · LanguageLabel [+ moods]" + newline + "a × b" (or pool empty text).
  const metaHead = result
    ? `${result.genreName} · ${LANGUAGE_LABELS[result.language] ?? result.language}` +
      (result.moods.length > 0 ? ` · ${result.moods.join(" + ")}` : "")
    : `${genre} · ${LANGUAGE_LABELS[language] ?? language}`;
  const metaArtists = chips.length > 0 ? chips.join(" × ") : poolEmptyText(artistPool);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <img src="/icon-512.png" alt="" width={22} height={22} />
              TRAKKNAME
            </span>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonSegment
          value={language}
          onIonChange={(e) => {
            const v = String(e.detail.value);
            setLanguage(v as "en" | "es");
            setStyle("Random");
            // Pool follows language (desktop _on_language_changed); user can override after.
            if (v === "en" || v === "es") setArtistPool(v);
          }}
        >
          <IonSegmentButton value="en">
            <IonLabel>English</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="es">
            <IonLabel>Spanish</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <OptionsPanel
          genres={genres}
          genre={genre}
          onGenre={setGenre}
          artistPool={artistPool}
          onPool={setArtistPool}
          artistCount={artistCount}
          onCount={setArtistCount}
          styles={styles}
          style={style}
          onStyle={setStyle}
          singleWord={singleWord}
          onToggleSingle={toggleSingle}
          useVerbs={useVerbs}
          useAdj={useAdj}
          useNouns={useNouns}
          onUseVerbs={(v) => changeWords("use_verbs", v)}
          onUseAdj={(v) => changeWords("use_adjectives", v)}
          onUseNouns={(v) => changeWords("use_nouns", v)}
        />

        <MoodsPanel
          open={moodsOpen}
          onToggleOpen={() => setMoodsOpen((o) => !o)}
          moods={moods}
          selected={selectedMoods}
          onToggleMood={toggleMood}
          onClear={clearMoods}
          search={moodSearch}
          onSearch={setMoodSearch}
        />

        <ArtistsPanel
          chips={chips}
          artistPool={artistPool}
          influence={influence}
          onReroll={rerollArtists}
          onInfluence={changeInfluence}
          onCopyChip={copyText}
        />

        <IonButton expand="block" className="trakk-generate" onClick={doGenerate}>
          GENERATE
        </IonButton>
        {error && <p style={{ color: "#e5484d" }}>{error}</p>}

        <ResultCard
          result={result}
          metaHead={metaHead}
          metaArtists={metaArtists}
          onCopy={() => result && copyText(result.title)}
        />
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
};

export default Generator;
