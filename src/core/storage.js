const prefix = 'alahram_v1';

export const storageKeys = {
  session: `${prefix}:session`,
  cart: `${prefix}:cart`,
  tier: `${prefix}:tier`,
  invoices: `${prefix}:invoices`,
};

export const legacyStorageKeys = [
  `${prefix}:customer`,
  `${prefix}:unitPrefs`,
  `${prefix}:qtyPrefs`,
  `${prefix}:cache`,
  `${prefix}:invoices`,
  `${prefix}:behavior`,
  `${prefix}:theme`,
  `${prefix}:invoiceSequence`,
];

export function purgeLegacyStorage() {
  for (const key of legacyStorageKeys) {
    localStorage.removeItem(key);
  }
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeValue(key) {
  localStorage.removeItem(key);
}

export function versionedKey(key, version) {
  return `${key}:v${version}`;
}
