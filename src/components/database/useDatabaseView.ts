/** All Data-tab view state: section/search/filters/add-word/remove (page stays thin). */
import { useMemo, useState } from "react";
import type { MemoryDb } from "../../lib/db/memory";
import { deleteRow, type DbSection } from "./dbRemove";

export function useDatabaseView(db: MemoryDb, toast: (m: string) => void) {
  const [section, setSection] = useState<DbSection>("words");
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [newWord, setNewWord] = useState("");
  const [newPos, setNewPos] = useState("noun");
  const [wordLang, setWordLang] = useState("All");
  const [wordPos, setWordPos] = useState("All");

  const bump = () => setVersion((v) => v + 1);
  const s = search.toLowerCase();

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

  const removeRow = (kind: DbSection, id: number, label: string) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    deleteRow(db, kind, id);
    bump();
  };

  const addWord = () => {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    if (db.words.some((x) => x.word.toLowerCase() === w)) {
      toast("Word already exists");
      return;
    }
    // Unshift (no push): la lista muestra .slice(0, 200), un push al final
    // con 2739 palabras semilla jamás sería visible.
    db.words.unshift({
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
    // Limpiar filtros para garantizar que la palabra quede visible arriba.
    setSearch("");
    setWordLang("All");
    setWordPos("All");
    bump();
    toast(`"${w}" added`);
  };

  return {
    section, setSection, search, setSearch, s,
    version, bump,
    newWord, setNewWord, newPos, setNewPos,
    wordLang, setWordLang, wordPos, setWordPos,
    counts, removeRow, addWord,
  };
}

export type DatabaseView = ReturnType<typeof useDatabaseView>;
