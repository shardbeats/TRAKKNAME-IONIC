/** JSON export (desktop-table shape) + download/share. Returns how it was delivered. */
import { Capacitor } from "@capacitor/core";
import type { MemoryDb } from "../../db/memory";

export function exportDatabase(db: MemoryDb): string {
  const data = {
    genres: db.genres,
    artists: db.artists,
    artist_genres: db.artistGenres,
    words: db.words,
    word_genres: db.wordGenres,
    patterns: db.patterns,
    genre_relations: db.relations,
    moods: db.moods,
    word_moods: db.wordMoods,
    generation_history: db.history,
  };
  return JSON.stringify(data, null, 2);
}

export type DownloadResult = "file" | "shared" | "clipboard" | "failed";

export async function downloadText(filename: string, text: string, mime = "application/json"): Promise<DownloadResult> {
  // En APK el <a download> no hace nada: usar Share sheet, si no clipboard.
  if (Capacitor.isNativePlatform()) {
    try {
      const nav = navigator as Navigator & {
        share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
        canShare?: (d: { files?: File[] }) => boolean;
      };
      const file = new File([text], filename, { type: `${mime};charset=utf-8` });
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: filename });
        return "shared";
      }
      if (nav.share) {
        await nav.share({ title: filename, text });
        return "shared";
      }
    } catch {
      return "failed"; // usuario canceló el share: no caer al clipboard sin pedirlo
    }
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      return "failed";
    }
  }
  // Web/desktop: descarga clásica con <a>.
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
    return "file";
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      return "failed";
    }
  }
}
