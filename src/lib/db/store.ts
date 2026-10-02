/**
 * Shared database instance for all tabs.
 *
 * getDb() lazily builds the MemoryDb from the bundled seed; resetDb() swaps
 * in a fresh copy and notifies subscribers. Pages must use useDb() (not a
 * useMemo snapshot) so a reset in the Database tab refreshes every tab.
 */
import { useSyncExternalStore } from "react";
import { loadSeedDb } from "./seed";
import type { MemoryDb } from "./memory";

let cached: MemoryDb | null = null;
const listeners = new Set<() => void>();

export function getDb(): MemoryDb {
  if (!cached) cached = loadSeedDb();
  return cached;
}

export function resetDb(): MemoryDb {
  cached = loadSeedDb();
  for (const notify of [...listeners]) notify();
  return cached;
}

function subscribeDb(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useDb(): MemoryDb {
  return useSyncExternalStore(subscribeDb, getDb, getDb);
}
