import { useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonViewWillEnter,
} from "@ionic/react";
import { useDb } from "../lib/db/store";
import { poolLabel } from "../lib/engine/types";

const History: React.FC = () => {
  const db = useDb();
  const [present] = useIonToast();
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);

  // Reload every time the tab is shown (desktop _on_generated -> history.reload()).
  useIonViewWillEnter(() => {
    setVersion((v) => v + 1);
  });

  const rows = useMemo(
    () => db.listHistory(300, search),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, search, version],
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      present({ message: "Copied", duration: 1200, position: "bottom" });
    } catch {
      present({ message: "Copy not available", duration: 1200, position: "bottom" });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>History ({rows.length})</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonSearchbar value={search} onIonInput={(e) => setSearch(String(e.detail.value ?? ""))} placeholder="Search history" />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <IonButton
            size="small"
            fill="outline"
            color="danger"
            onClick={() => {
              if (window.confirm("Delete all history?")) {
                db.clearHistory();
                setVersion((v) => v + 1);
              }
            }}
          >
            Clear all
          </IonButton>
        </div>
        <IonList>
          {rows.map((h) => (
            <IonItem key={h.id}>
              <IonLabel onClick={() => copy(h.title)}>
                <h2>{h.title}</h2>
                <p>
                  {h.genre_name ?? ""} · {h.language}
                  {h.moods.length > 0 ? ` · ${h.moods.join(" + ")}` : ""} · {poolLabel(h.artist_pool)}
                </p>
                <p className="trakk-muted">{h.created_at}</p>
              </IonLabel>
              <IonButton
                slot="end"
                size="small"
                fill="clear"
                color="danger"
                onClick={() => {
                  db.deleteHistory(h.id);
                  setVersion((v) => v + 1);
                }}
              >
                Delete
              </IonButton>
            </IonItem>
          ))}
        </IonList>
        {rows.length === 0 && <p className="trakk-muted">No titles yet. Generate some first.</p>}
      </IonContent>
    </IonPage>
  );
};

export default History;
