import { IonButton } from "@ionic/react";
import type { GenerationResult } from "../../lib/engine/types";

export interface ResultCardProps {
  result: GenerationResult | null;
  metaHead: string;
  metaArtists: string;
  onCopy: () => void;
}

/** Always rendered (desktop shows "Press Generate") so actions never move. */
export const ResultCard: React.FC<ResultCardProps> = (p) => (
  <div className="trakk-panel">
    <div className="trakk-title-big">{p.result ? p.result.title.toUpperCase() : "Press Generate"}</div>
    <p className="trakk-muted" style={{ textAlign: "center", whiteSpace: "pre-line" }}>
      {p.metaHead}
      {"\n"}
      {p.metaArtists}
    </p>
    <IonButton expand="block" disabled={!p.result} onClick={p.onCopy}>
      Copy
    </IonButton>
  </div>
);
