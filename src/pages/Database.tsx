import { useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { resetDb, useDb } from "../lib/db/store";
import { downloadText, exportDatabase, importDatabase } from "../lib/services/library";

type Section = "genres" | "words" | "artists" | "patterns" | "moods";

const Database: React.FC = () => {
  const db = useDb();
  const [present] = useIonToast();
  const [section, setSection] = useState<Section>("words");
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [newWord, setNewWord] = useState("");
  const [newPos, setNewPos] = useState("noun");
  const [wordLang, setWordLang] = useState("All");
  const [wordPos, setWordPos] = useState("All");

  const bump = () => setVersion((v) => v + 1);
  const toast = (message: string) => present({ message, duration: 1400, position: "bottom" });

  const genreName = (id: number) => db.genres.find((g) => g.id === id)?.name ?? "?";
  const artistLinks = (artistId: number) =>
    db.artistGenres
      .filter((ag) => ag.artist_id === artistId)
      .map((ag) => `${genreName(ag.genre_id)} (${ag.weight})`)
      .join(", ");
  const wordGenreNames = (wordId: number) => {
    const names = db.wordGenres
      .filter((wg) => wg.word_id === wordId)
      .map((wg) => genreName(wg.genre_id));
    return names.length > 0 ? names.join(", ") : "global";
  };
  const moodWordCount = (moodId: number) => db.wordMoods.filter((wm) => wm.mood_id === moodId).length;

  const removeRow = (kind: Section, id: number, label: string) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    if (kind === "genres") {
      db.genres = db.genres.filter((g) => g.id !== id);
      db.artistGenres = db.artistGenres.filter((ag) => ag.genre_id !== id);
      db.wordGenres = db.wordGenres.filter((wg) => wg.genre_id !== id);
      db.relations = db.relations.filter((r) => r.genre_id !== id && r.related_genre_id !== id);
    } else if (kind === "artists") {
      db.artists = db.artists.filter((a) => a.id !== id);
      db.artistGenres = db.artistGenres.filter((ag) => ag.artist_id !== id);
    } else if (kind === "words") {
      db.words = db.words.filter((w) => w.id !== id);
      db.wordGenres = db.wordGenres.filter((wg) => wg.word_id !== id);
      db.wordMoods = db.wordMoods.filter((wm) => wm.word_id !== id);
    } else if (kind === "patterns") {
      db.patterns = db.patterns.filter((p) => p.id !== id);
    } else {
      db.moods = db.moods.filter((m) => m.id !== id);
      db.wordMoods = db.wordMoods.filter((wm) => wm.mood_id !== id);
    }
    bump();
  };

  const delBtn = (kind: Section, id: number, label: string) => (
    <IonButton
      slot="end"
      size="small"
      fill="clear"
      color="danger"
      onClick={() => removeRow(kind, id, label)}
    >
      Delete
    </IonButton>
  );

  const counts = useMemo(
    () => ({
      genres: db.genres.length,
      words: db.words.length,
      artists: db.artists.length,
      patterns: db.patterns.length,
      moods: db.moods.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, version],
  );

  const s = search.toLowerCase();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Database</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <p className="trakk-muted">
          {counts.genres} genres · {counts.artists} artists · {counts.words} words · {counts.moods} moods ·{" "}
          {counts.patterns} patterns
        </p>
        <IonSegment value={section} onIonChange={(e) => setSection(String(e.detail.value) as Section)} scrollable>
          <IonSegmentButton value="genres">
            <IonLabel>Genres</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="words">
            <IonLabel>Words</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="artists">
            <IonLabel>Artists</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="patterns">
            <IonLabel>Patterns</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="moods">
            <IonLabel>Moods</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonSearchbar value={search} onIonInput={(e) => setSearch(String(e.detail.value ?? ""))} placeholder="Search" />

        {section === "words" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={wordLang} onChange={(e) => setWordLang(e.target.value)} style={{ background: "#202124", color: "#E5E5E5", borderRadius: 8 }}>
              <option value="All">All</option>
              <option value="en">en</option>
              <option value="es">es</option>
            </select>
            <select value={wordPos} onChange={(e) => setWordPos(e.target.value)} style={{ background: "#202124", color: "#E5E5E5", borderRadius: 8 }}>
              <option value="All">All</option>
              <option value="verb">verb</option>
              <option value="adjective">adjective</option>
              <option value="noun">noun</option>
            </select>
          </div>
        )}

        {section === "words" && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <IonInput value={newWord} placeholder="new word (lowercase)" onIonInput={(e) => setNewWord(String(e.detail.value ?? ""))} />
              <select value={newPos} onChange={(e) => setNewPos(e.target.value)} style={{ background: "#202124", color: "#E5E5E5", borderRadius: 8 }}>
                <option value="noun">noun</option>
                <option value="adjective">adjective</option>
                <option value="verb">verb</option>
              </select>
              <IonButton
                size="small"
                onClick={() => {
                  const w = newWord.trim().toLowerCase();
                  if (!w) return;
                  if (db.words.some((x) => x.word === w)) {
                    toast("Word already exists");
                    return;
                  }
                  db.words.push({
                    id: db.nextTempId(),
                    word: w,
                    language: /[áéíóúñ]/i.test(w) ? "es" : "en",
                    part_of_speech: newPos as "noun" | "adjective" | "verb",
                    weight: 1,
                    enabled: 1,
                    gender: null,
                    number: null,
                  });
                  setNewWord("");
                  bump();
                }}
              >
                Add
              </IonButton>
            </div>
            <IonList>
              {db.words
                .filter(
                  (w) =>
                    (!s || w.word.includes(s)) &&
                    (wordLang === "All" || w.language === wordLang) &&
                    (wordPos === "All" || w.part_of_speech === wordPos),
                )
                .slice(0, 200)
                .map((w) => (
                  <IonItem key={w.id}>
                    <IonLabel>
                      <h2>{w.word}</h2>
                      <p>
                        {w.language} · {w.part_of_speech} · w={w.weight} · {wordGenreNames(w.id)}
                      </p>
                    </IonLabel>
                    <IonToggle checked={w.enabled === 1} onIonChange={(e) => { w.enabled = e.detail.checked ? 1 : 0; bump(); }} />
                    {delBtn("words", w.id, w.word)}
                  </IonItem>
                ))}
            </IonList>
          </>
        )}

        {section === "genres" && (
          <IonList>
            {db.genres
              .filter((g) => !s || g.name.toLowerCase().includes(s))
              .map((g) => (
                <IonItem key={g.id}>
                  <IonLabel>
                    <h2>{g.name}</h2>
                    <p>{g.description}</p>
                  </IonLabel>
                  <IonToggle checked={g.enabled === 1} onIonChange={(e) => { g.enabled = e.detail.checked ? 1 : 0; bump(); }} />
                  {delBtn("genres", g.id, g.name)}
                </IonItem>
              ))}
          </IonList>
        )}

        {section === "artists" && (
          <IonList>
            {db.artists
              .filter((a) => !s || a.name.toLowerCase().includes(s))
              .slice(0, 300)
              .map((a) => (
                <IonItem key={a.id}>
                  <IonLabel>
                    <h2>{a.name}</h2>
                    <p>
                      {a.language ?? "?"} · {a.region ?? ""} · {artistLinks(a.id)}
                    </p>
                  </IonLabel>
                  <IonToggle checked={a.enabled === 1} onIonChange={(e) => { a.enabled = e.detail.checked ? 1 : 0; bump(); }} />
                  {delBtn("artists", a.id, a.name)}
                </IonItem>
              ))}
          </IonList>
        )}

        {section === "patterns" && (
          <IonList>
            {db.patterns
              .filter((p) => !s || p.name.toLowerCase().includes(s) || p.template.toLowerCase().includes(s))
              .map((p) => (
                <IonItem key={p.id}>
                  <IonLabel>
                    <h2>{p.name}</h2>
                    <p>
                      {p.language} · {p.template} · w={p.weight}
                    </p>
                  </IonLabel>
                  <IonToggle checked={p.enabled === 1} onIonChange={(e) => { p.enabled = e.detail.checked ? 1 : 0; bump(); }} />
                  {delBtn("patterns", p.id, p.name)}
                </IonItem>
              ))}
          </IonList>
        )}

        {section === "moods" && (
          <IonList>
            {db.moods
              .filter((m) => !s || m.name.toLowerCase().includes(s))
              .map((m) => (
                <IonItem key={m.id}>
                  <IonLabel>
                    <h2>
                      {m.icon ? `${m.icon} ` : ""}
                      {m.name}
                    </h2>
                    <p>
                      {moodWordCount(m.id)} vibe words{m.description ? ` · ${m.description}` : ""}
                    </p>
                  </IonLabel>
                  <IonToggle checked={m.enabled === 1} onIonChange={(e) => { m.enabled = e.detail.checked ? 1 : 0; bump(); }} />
                  {delBtn("moods", m.id, m.name)}
                </IonItem>
              ))}
          </IonList>
        )}

        <div className="trakk-panel" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <IonButton size="small" fill="outline" onClick={() => downloadText("trakkname-backup.json", exportDatabase(db))}>
              Export JSON
            </IonButton>
            <label style={{ display: "inline-flex", alignItems: "center" }}>
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!window.confirm("Import will merge (never silently overwrite). Continue?")) return;
                  try {
                    importDatabase(db, await f.text());
                    bump();
                    toast("Import merged");
                  } catch {
                    toast("Invalid JSON");
                  }
                }}
              />
              <span className="trakk-chip">Import JSON</span>
            </label>
            <IonButton
              size="small"
              fill="outline"
              color="danger"
              onClick={() => {
                if (!window.confirm("Reset database to bundled seed? Local edits will be lost.")) return;
                resetDb();
                bump();
              }}
            >
              Reset to seed
            </IonButton>
          </div>
          <p className="trakk-muted">Migrations never overwrite edits. Import merges by id/name.</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Database;
