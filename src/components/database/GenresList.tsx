import { IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { RowDeleteButton } from "./RowDeleteButton";
import type { DatabaseView } from "./useDatabaseView";

export const GenresList: React.FC<{ db: MemoryDb; view: DatabaseView }> = ({ db, view }) => (
  <IonList>
    {db.genres
      .filter((g) => !view.s || g.name.toLowerCase().includes(view.s))
      .map((g) => (
        <IonItem key={g.id}>
          <IonLabel>
            <h2>{g.name}</h2>
            <p>{g.description}</p>
          </IonLabel>
          <IonToggle checked={g.enabled === 1} onIonChange={(e) => { g.enabled = e.detail.checked ? 1 : 0; view.bump(); }} />
          <RowDeleteButton kind="genres" id={g.id} label={g.name} onDelete={view.removeRow} />
        </IonItem>
      ))}
  </IonList>
);
