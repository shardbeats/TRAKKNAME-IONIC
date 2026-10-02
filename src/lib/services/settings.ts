/** Persistent settings — localStorage (web) with same defaults as Python SettingsService. */
import { DEFAULT_SETTINGS, type SettingsData } from "../engine/types";

const KEY = "trakkname.settings.v1";

function migratePool(v: unknown): unknown {
  return v === "latam" ? "es" : v;
}

export class SettingsService {
  data: SettingsData = { ...DEFAULT_SETTINGS };
  constructor() {
    this.load();
  }
  load(): SettingsData {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsData>;
        this.data = { ...DEFAULT_SETTINGS, ...parsed };
        if ((this.data as { artist_pool: string }).artist_pool === "latam") {
          (this.data as { artist_pool: string }).artist_pool = migratePool("latam") as never;
        }
      }
    } catch {
      this.data = { ...DEFAULT_SETTINGS };
    }
    return this.data;
  }
  save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* offline/private mode: keep in memory */
    }
  }
  get<K extends keyof SettingsData>(key: K): SettingsData[K] {
    return this.data[key];
  }
  set<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.data[key] = value;
    this.save();
  }
}

let instance: SettingsService | null = null;
export function getSettings(): SettingsService {
  if (!instance) instance = new SettingsService();
  return instance;
}
