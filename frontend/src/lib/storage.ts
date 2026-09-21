/**
 * JSON helpers around localStorage that never throw (private mode, quota,
 * server-side rendering...).
 */
export const storage = {
  read<T>(key: string): T | null {
    try {
      const raw = globalThis.localStorage?.getItem(key);

      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  write(key: string, value: unknown): void {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is a convenience: the session still works in memory.
    }
  },

  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Nothing to clean up.
    }
  },
};
