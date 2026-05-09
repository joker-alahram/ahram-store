const canUseStorage = (() => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
})();

export function storageGet(key, fallback = null) {
  if (!canUseStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  if (!canUseStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function storageRemove(key) {
  if (!canUseStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
