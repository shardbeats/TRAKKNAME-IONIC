import { IonButton, IonRange } from "@ionic/react";
import { poolEmptyText } from "../../lib/engine/types";

export interface ArtistsPanelProps {
  chips: string[];
  artistPool: string;
  influence: number;
  onReroll: () => void;
  onInfluence: (v: number) => void;
  onCopyChip: (text: string) => void;
}

/**
 * Fixed header (Re-roll never moves) + chips box with reserved height so
 * buttons below don't jump when names are short.
 */
export const ArtistsPanel: React.FC<ArtistsPanelProps> = (p) => (
  <div className="trakk-panel">
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <strong>Artists</strong>
      <IonButton size="small" fill="outline" onClick={p.onReroll} title="Re-roll artists only (keeps the title)">
        Re-roll
      </IonButton>
      <span style={{ flex: 1 }} />
      <span className="trakk-muted" style={{ fontSize: 11 }}>Influence</span>
      <IonRange
        min={0}
        max={100}
        value={Math.round(p.influence * 100)}
        onIonChange={(e) => p.onInfluence(Number(e.detail.value) / 100)}
        style={{ maxWidth: 130 }}
      />
    </div>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
        minHeight: 76,
        alignContent: "flex-start",
      }}
    >
      {p.chips.map((a) => (
        <span key={a} className="trakk-chip" onClick={() => p.onCopyChip(a)}>
          {a}
        </span>
      ))}
      {p.chips.length === 0 && <span className="trakk-muted">{poolEmptyText(p.artistPool)}</span>}
    </div>
  </div>
);
