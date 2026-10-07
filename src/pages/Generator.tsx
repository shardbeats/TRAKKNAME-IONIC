import { useMemo } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { useDb } from "../lib/db/store";
import { GenerationService } from "../lib/services/generation";
import { getSettings } from "../lib/services/settings";
import { OptionsPanel } from "../components/generator/OptionsPanel";
import { ArtistsPanel } from "../components/generator/ArtistsPanel";
import { MoodsPanel } from "../components/generator/MoodsPanel";
import { ResultCard } from "../components/generator/ResultCard";
import { LanguageSegment } from "../components/generator/LanguageSegment";
import { buildMetaArtists, buildMetaHead } from "../components/generator/generatorMeta";
import { useGeneratorState } from "../components/generator/useGeneratorState";

const Generator: React.FC = () => {
  const db = useDb();
  const settings = useMemo(() => getSettings(), []);
  const service = useMemo(() => new GenerationService(db, settings), [db, settings]);
  const [present] = useIonToast();
  const s = useGeneratorState(db, settings, service);

  const toast = (message: string) => present({ message, duration: 1400, position: "bottom" });

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${text} copied!`);
    } catch {
      toast("Copy not available");
    }
  };

  const metaHead = buildMetaHead(s.result, s.genre, s.language);
  const metaArtists = buildMetaArtists(s.chips, s.artistPool);

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
        <LanguageSegment language={s.language} onChange={s.changeLanguage} />

        <OptionsPanel
          genres={s.genres}
          genre={s.genre}
          onGenre={s.setGenre}
          artistPool={s.artistPool}
          onPool={s.setArtistPool}
          artistCount={s.artistCount}
          onCount={s.setArtistCount}
          styles={s.styles}
          style={s.style}
          onStyle={s.setStyle}
          singleWord={s.singleWord}
          onToggleSingle={s.toggleSingle}
          useVerbs={s.useVerbs}
          useAdj={s.useAdj}
          useNouns={s.useNouns}
          onUseVerbs={(v) => s.changeWords("use_verbs", v)}
          onUseAdj={(v) => s.changeWords("use_adjectives", v)}
          onUseNouns={(v) => s.changeWords("use_nouns", v)}
        />

        <MoodsPanel
          open={s.moodsOpen}
          onToggleOpen={() => s.setMoodsOpen((o) => !o)}
          moods={s.moods}
          selected={s.selectedMoods}
          onToggleMood={s.toggleMood}
          onClear={s.clearMoods}
          search={s.moodSearch}
          onSearch={s.setMoodSearch}
        />

        <ArtistsPanel
          chips={s.chips}
          artistPool={s.artistPool}
          influence={s.influence}
          onReroll={s.rerollArtists}
          onInfluence={s.changeInfluence}
          onCopyChip={copyText}
        />

        <IonButton expand="block" className="trakk-generate" onClick={s.doGenerate}>
          GENERATE
        </IonButton>
        {s.error && <p style={{ color: "#e5484d" }}>{s.error}</p>}

        <ResultCard
          result={s.result}
          metaHead={metaHead}
          metaArtists={metaArtists}
          onCopy={() => s.result && copyText(s.result.title)}
        />
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
};

export default Generator;
