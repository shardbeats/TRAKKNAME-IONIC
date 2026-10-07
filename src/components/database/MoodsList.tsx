import { IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { moodWordCount } from "./dbLabels";
import { RowDeleteButton } from "./RowDeleteButton";
import type { DatabaseView } from "./useDatabaseView";

export const MoodsList: React.FC<{ db: MemoryDb; view: DatabaseView }> = ({ db, view }) => (
  <IonList>
    {db.moods
      .filter((m) => !view.s || m.name.toLowerCase().includes(view.s))
      .map((m) => (
        <IonItem key={m.id}>
          <IonLabel>
            <h2>
              {m.icon ? `${m.icon} ` : ""}
              {m.name}
            </h2>
            <p>
              {moodWordCount(db, m.id)} vibe words{m.description ? ` · ${m.description}` : ""}
            </p>
          </IonLabel>
          <IonToggle checked={m.enabled === 1} onIonChange={(e) => { m.enabled = e.detail.checked ? 1 : 0; view.bump(); }} />
          <RowDeleteButton kind="moods" id={m.id} label={m.name} onDelete={view.removeRow} />
        </IonItem>
      ))}
  </IonList>
);
