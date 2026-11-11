import { useCallback, useSyncExternalStore } from "react";

/** Guest favourites live in this browser only — no account needed. */
const KEY = "opmotors:favourites";
const LEGACY_KEY = "ahaban:favourites";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    const parsed = JSON.parse(raw ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage may be unavailable (private mode) — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function toggleFavouriteIn(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavourites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => write(toggleFavouriteIn(read(), id)), []);
  const remove = useCallback((id: string) => write(read().filter((x) => x !== id)), []);
  const isFavourite = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, remove, isFavourite };
}
