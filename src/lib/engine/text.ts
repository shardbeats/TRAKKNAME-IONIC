/** Small text helpers — port of app/utils/text.py */

export function normalizeTitle(title: string): string {
  return title.toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

export function titleCase(title: string, language = "en"): string {
  const words = title.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return title;
  const cap = (w: string) =>
    w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  if (language === "es") {
    const lowerKeep = new Set(["de", "la", "los", "las", "el", "y", "en"]);
    const out = [cap(words[0])];
    for (const w of words.slice(1)) {
      out.push(lowerKeep.has(w.toLowerCase()) ? w.toLowerCase() : cap(w));
    }
    return out.join(" ");
  }
  return words.map(cap).join(" ");
}

export function slugWords(text: string): string[] {
  const m = text.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g);
  return m ?? [];
}
