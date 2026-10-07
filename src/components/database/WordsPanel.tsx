import { IonButton, IonInput, IonItem, IonLabel, IonList, IonToggle } from "@ionic/react";
import type { MemoryDb } from "../../lib/db/memory";
import { wordGenreNames } from "./dbLabels";
import { RowDeleteButton } from "./RowDeleteButton";
import type { DatabaseView } from "./useDatabaseView";

const selectStyle = { background: "#202124", color: "#E5E5E5", borderRadius: 8 };

export const WordsPanel: React.FC<{ db: MemoryDb; view: DatabaseView }> = ({ db, view }) => (
  <>
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <select value={view.wordLang} onChange={(e) => view.setWordLang(e.target.value)} style={selectStyle}>
        <option value="All">All</option>
        <option value="en">en</option>
        <option value="es">es</option>
      </select>
      <select value={view.wordPos} onChange={(e) => view.setWordPos(e.target.value)} style={selectStyle}>
        <option value="All">All</option>
        <option value="verb">verb</option>
        <option value="adjective">adjective</option>
        <option value="noun">noun</option>
      </select>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <IonInput value={view.newWord} placeholder="new word (lowercase)" onIonInput={(e) => view.setNewWord(String(e.detail.value ?? ""))} />
      <select value={view.newPos} onChange={(e) => view.setNewPos(e.target.value)} style={selectStyle}>
        <option value="noun">noun</option>
        <option value="adjective">adjective</option>
        <option value="verb">verb</option>
      </select>
      <IonButton size="small" onClick={view.addWord}>
        Add
      </IonButton>
    </div>
    <IonList>
      {db.words
        .filter(
          (w) =>
            (!view.s || w.word.includes(view.s)) &&
            (view.wordLang === "All" || w.language === view.wordLang) &&
            (view.wordPos === "All" || w.part_of_speech === view.wordPos),
        )
        .slice(0, 200)
        .map((w) => (
          <IonItem key={w.id}>
            <IonLabel>
              <h2>{w.word}</h2>
              <p>
                {w.language} · {w.part_of_speech} · w={w.weight} · {wordGenreNames(db, w.id)}
              </p>
            </IonLabel>
            <IonToggle checked={w.enabled === 1} onIonChange={(e) => { w.enabled = e.detail.checked ? 1 : 0; view.bump(); }} />
            <RowDeleteButton kind="words" id={w.id} label={w.word} onDelete={view.removeRow} />
          </IonItem>
        ))}
    </IonList>
  </>
);
