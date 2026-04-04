const TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sessionStorage may be unavailable (private mode quota) — fail silently
  }
}

export function invalidateCache(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // fail silently
  }
}
