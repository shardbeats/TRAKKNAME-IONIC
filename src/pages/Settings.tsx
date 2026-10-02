import { useMemo, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRange,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import { getSettings } from "../lib/services/settings";

const Settings: React.FC = () => {
  const settings = useMemo(() => getSettings(), []);
  const [, setTick] = useState(0);
  // Re-read shared keys when the tab is shown (Generator edits the same keys).
  useIonViewWillEnter(() => {
    settings.load();
    setTick((t) => t + 1);
  });
  const refresh = () => {
    settings.save();
    setTick((t) => t + 1);
  };
  const d = settings.data;

  const num = (v: unknown, dflt: number) => Number(v ?? dflt);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="trakk-panel">
          <h3 style={{ marginTop: 0 }}>Mixture weights (genre / related / global)</h3>
          <IonItem>
            <IonLabel>Genre: {num(d.w_genre, 0.7).toFixed(2)}</IonLabel>
          </IonItem>
          <IonRange min={0} max={1} step={0.05} value={num(d.w_genre, 0.7)} onIonChange={(e) => { settings.set("w_genre", Number(e.detail.value)); refresh(); }} />
          <IonItem>
            <IonLabel>Related: {num(d.w_related, 0.2).toFixed(2)}</IonLabel>
          </IonItem>
          <IonRange min={0} max={1} step={0.05} value={num(d.w_related, 0.2)} onIonChange={(e) => { settings.set("w_related", Number(e.detail.value)); refresh(); }} />
          <IonItem>
            <IonLabel>Global: {num(d.w_global, 0.1).toFixed(2)}</IonLabel>
          </IonItem>
          <IonRange min={0} max={1} step={0.05} value={num(d.w_global, 0.1)} onIonChange={(e) => { settings.set("w_global", Number(e.detail.value)); refresh(); }} />
        </div>

        <div className="trakk-panel">
          <IonItem>
            <IonLabel>Artist influence: {num(d.artist_influence, 0.5).toFixed(2)}</IonLabel>
          </IonItem>
          <IonRange min={0} max={1} step={0.05} value={num(d.artist_influence, 0.5)} onIonChange={(e) => { settings.set("artist_influence", Number(e.detail.value)); refresh(); }} />
          <IonItem>
            <IonLabel>Mood influence: {num(d.w_mood, 1).toFixed(2)}</IonLabel>
          </IonItem>
          <IonRange min={0} max={3} step={0.25} value={num(d.w_mood, 1)} onIonChange={(e) => { settings.set("w_mood", Number(e.detail.value)); refresh(); }} />
          <IonItem>
            <IonLabel>Avoid last N titles: {d.recent_exclusion_count}</IonLabel>
          </IonItem>
          <IonRange
            min={0}
            max={1000}
            step={10}
            value={num(d.recent_exclusion_count, 100)}
            onIonChange={(e) => { settings.set("recent_exclusion_count", Number(e.detail.value)); refresh(); }}
          />
        </div>

        <div className="trakk-panel">
          <h3 style={{ marginTop: 0 }}>Word types</h3>
          <IonList>
            <IonItem>
              <IonLabel>Verbs</IonLabel>
              <IonToggle checked={d.use_verbs} onIonChange={(e) => { settings.set("use_verbs", e.detail.checked); refresh(); }} />
            </IonItem>
            <IonItem>
              <IonLabel>Adjectives</IonLabel>
              <IonToggle checked={d.use_adjectives} onIonChange={(e) => { settings.set("use_adjectives", e.detail.checked); refresh(); }} />
            </IonItem>
            <IonItem>
              <IonLabel>Nouns</IonLabel>
              <IonToggle checked={d.use_nouns} onIonChange={(e) => { settings.set("use_nouns", e.detail.checked); refresh(); }} />
            </IonItem>
          </IonList>
          <p className="trakk-muted">If all off, all types are allowed (same as desktop).</p>
        </div>

        <div className="trakk-panel">
          <p className="trakk-muted">
            Language, genre, style, moods and pool are edited on the Generator tab and persist here.
          </p>
          <p className="trakk-muted">Default genre: {d.default_genre} · Default language: {d.default_language}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
