import { IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { artistLinks } from "./dbLabels";
import { RowDeleteButton } from "./RowDeleteButton";
import type { DatabaseView } from "./useDatabaseView";

export const ArtistsList: React.FC<{ db: MemoryDb; view: DatabaseView }> = ({ db, view }) => (
  <IonList>
    {db.artists
      .filter((a) => !view.s || a.name.toLowerCase().includes(view.s))
      .slice(0, 300)
      .map((a) => (
        <IonItem key={a.id}>
          <IonLabel>
            <h2>{a.name}</h2>
            <p>
              {a.language ?? "?"} · {a.region ?? ""} · {artistLinks(db, a.id)}
            </p>
          </IonLabel>
          <IonToggle checked={a.enabled === 1} onIonChange={(e) => { a.enabled = e.detail.checked ? 1 : 0; view.bump(); }} />
          <RowDeleteButton kind="artists" id={a.id} label={a.name} onDelete={view.removeRow} />
        </IonItem>
      ))}
  </IonList>
);
