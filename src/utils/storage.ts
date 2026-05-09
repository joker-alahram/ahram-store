export const safeStorage = {
  get<T>(storage: Storage | undefined, key: string, fallback: T): T {
    try {
      const raw = storage?.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set(storage: Storage | undefined, key: string, value: unknown) {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
  remove(storage: Storage | undefined, key: string) {
    try {
      storage?.removeItem(key);
    } catch {
      // ignore
    }
  },
};
