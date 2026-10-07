import { IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { RowDeleteButton } from "./RowDeleteButton";
import type { DatabaseView } from "./useDatabaseView";

export const PatternsList: React.FC<{ db: MemoryDb; view: DatabaseView }> = ({ db, view }) => (
  <IonList>
    {db.patterns
      .filter((p) => !view.s || p.name.toLowerCase().includes(view.s) || p.template.toLowerCase().includes(view.s))
      .map((p) => (
        <IonItem key={p.id}>
          <IonLabel>
            <h2>{p.name}</h2>
            <p>
              {p.language} · {p.template} · w={p.weight}
            </p>
          </IonLabel>
          <IonToggle checked={p.enabled === 1} onIonChange={(e) => { p.enabled = e.detail.checked ? 1 : 0; view.bump(); }} />
          <RowDeleteButton kind="patterns" id={p.id} label={p.name} onDelete={view.removeRow} />
        </IonItem>
      ))}
  </IonList>
);
