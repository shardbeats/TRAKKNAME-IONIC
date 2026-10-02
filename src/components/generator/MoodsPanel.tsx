import { IonButton, IonChip, IonSearchbar } from "@ionic/react";

export const MAX_MOODS = 2;

export interface MoodsPanelProps {
  open: boolean;
  onToggleOpen: () => void;
  moods: Array<{ id: number; name: string }>;
  selected: string[];
  onToggleMood: (name: string) => void;
  onClear: () => void;
  search: string;
  onSearch: (v: string) => void;
}

/** Collapsible mood picker (desktop MoodSidebar parity: FIFO, search, clear). */
export const MoodsPanel: React.FC<MoodsPanelProps> = (p) => (
  <div className="trakk-panel">
    <IonButton fill="clear" size="small" onClick={p.onToggleOpen}>
      MOOD {p.selected.length > 0 ? `(${p.selected.length}/${MAX_MOODS})` : ""} {p.open ? "-" : "+"}
    </IonButton>
    {p.open && (
      <div>
        <p className="trakk-muted" style={{ margin: "0 0 4px" }}>
          Empty = any{p.selected.length > 0 ? ` · ${p.selected.length}/${MAX_MOODS}` : ""}
        </p>
        <IonSearchbar value={p.search} onIonInput={(e) => p.onSearch(String(e.detail.value ?? ""))} placeholder="Search moods" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {p.moods.map((m) => (
            <IonChip
              key={m.id}
              color={p.selected.includes(m.name) ? "warning" : undefined}
              onClick={() => p.onToggleMood(m.name)}
            >
              {m.name}
            </IonChip>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <IonButton size="small" fill="clear" onClick={p.onClear}>
            Clear
          </IonButton>
        </div>
      </div>
    )}
  </div>
);
