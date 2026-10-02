import {
  IonButton,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonRange,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";

export interface OptionsPanelProps {
  genres: Array<{ id: number; name: string }>;
  genre: string;
  onGenre: (v: string) => void;
  artistPool: string;
  onPool: (v: string) => void;
  artistCount: number;
  onCount: (v: number) => void;
  styles: string[];
  style: string;
  onStyle: (v: string) => void;
  singleWord: boolean;
  onToggleSingle: () => void;
  useVerbs: boolean;
  useAdj: boolean;
  useNouns: boolean;
  onUseVerbs: (v: boolean) => void;
  onUseAdj: (v: boolean) => void;
  onUseNouns: (v: boolean) => void;
}

/** Genre / pool / count / style / word-type controls (desktop parity). */
export const OptionsPanel: React.FC<OptionsPanelProps> = (p) => (
  <div className="trakk-panel">
    <IonList>
      <IonItem>
        <IonLabel>Genre</IonLabel>
        <IonSelect value={p.genre} onIonChange={(e) => p.onGenre(String(e.detail.value))} interface="popover">
          {p.genres.map((g) => (
            <IonSelectOption key={g.id} value={g.name}>
              {g.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel>Artist pool</IonLabel>
        <IonSelect value={p.artistPool} onIonChange={(e) => p.onPool(String(e.detail.value))} interface="popover">
          <IonSelectOption value="all">All</IonSelectOption>
          <IonSelectOption value="es">En español</IonSelectOption>
          <IonSelectOption value="en">English</IonSelectOption>
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel>Artists per generation: {p.artistCount}</IonLabel>
      </IonItem>
    </IonList>
    <IonRange min={1} max={5} step={1} snaps value={p.artistCount} onIonChange={(e) => p.onCount(Number(e.detail.value))} />
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
      <IonItem style={{ flex: 1 }} disabled={p.singleWord}>
        <IonLabel>Style</IonLabel>
        <IonSelect value={p.style} onIonChange={(e) => p.onStyle(String(e.detail.value))} interface="popover">
          {p.styles.map((s) => (
            <IonSelectOption key={s} value={s}>
              {s}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonButton
        fill={p.singleWord ? "solid" : "outline"}
        color="warning"
        title="Single-word titles: one noun only"
        onClick={p.onToggleSingle}
      >
        1-WORD
      </IonButton>
    </div>
    <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
      <span className="trakk-muted">Words:</span>
      <IonCheckbox checked={p.useVerbs} onIonChange={(e) => p.onUseVerbs(e.detail.checked)}>
        Verbs
      </IonCheckbox>
      <IonCheckbox checked={p.useAdj} onIonChange={(e) => p.onUseAdj(e.detail.checked)}>
        Adjectives
      </IonCheckbox>
      <IonCheckbox checked={p.useNouns} onIonChange={(e) => p.onUseNouns(e.detail.checked)}>
        Nouns
      </IonCheckbox>
    </div>
  </div>
);
