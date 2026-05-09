const prefix = 'alahram_v1';

export const storageKeys = {
  session: `${prefix}:session`,
  cart: `${prefix}:cart`,
  tier: `${prefix}:tier`,
  unitPrefs: `${prefix}:unitPrefs`,
  qtyPrefs: `${prefix}:qtyPrefs`,
  customer: `${prefix}:customer`,
  cache: `${prefix}:cache`,
  invoices: `${prefix}:invoices`,
  behavior: `${prefix}:behavior`,
  theme: `${prefix}:theme`,
  invoiceSequence: `${prefix}:invoiceSequence`,
};

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
