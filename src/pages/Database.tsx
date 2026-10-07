import {
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { useDb } from "../lib/db/store";
import { ArtistsList } from "../components/database/ArtistsList";
import { BackupBar } from "../components/database/BackupBar";
import { GenresList } from "../components/database/GenresList";
import { MoodsList } from "../components/database/MoodsList";
import { PatternsList } from "../components/database/PatternsList";
import { SectionTabs } from "../components/database/SectionTabs";
import { WordsPanel } from "../components/database/WordsPanel";
import { useDatabaseView } from "../components/database/useDatabaseView";

const Database: React.FC = () => {
  const db = useDb();
  const [present] = useIonToast();
  const toast = (message: string) => present({ message, duration: 1400, position: "bottom" });
  const view = useDatabaseView(db, toast);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Database</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <p className="trakk-muted">
          {view.counts.genres} genres · {view.counts.artists} artists · {view.counts.words} words · {view.counts.moods} moods ·{" "}
          {view.counts.patterns} patterns
        </p>
        <SectionTabs section={view.section} onChange={view.setSection} />

        <IonSearchbar value={view.search} onIonInput={(e) => view.setSearch(String(e.detail.value ?? ""))} placeholder="Search" />

        {view.section === "words" && <WordsPanel db={db} view={view} />}

        {view.section === "genres" && <GenresList db={db} view={view} />}

        {view.section === "artists" && <ArtistsList db={db} view={view} />}

        {view.section === "patterns" && <PatternsList db={db} view={view} />}

        {view.section === "moods" && <MoodsList db={db} view={view} />}

        <BackupBar db={db} onChanged={view.bump} toast={toast} />
      </IonContent>
    </IonPage>
  );
};

export default Database;
