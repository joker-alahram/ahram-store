const prefix = 'alahram_v1';

export const storageKeys = {
  session: `${prefix}:session`,
  cart: `${prefix}:cart`,
  tier: `${prefix}:tier`,
  catalog: `${prefix}:catalog`,
  companyRowsCache: `${prefix}:companyRowsCache`,
  selectedCustomer: `${prefix}:selectedCustomer`,
  theme: `${prefix}:uiTheme`,
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
  `${prefix}:companyRowsCache`,
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

function isQuotaExceededError(error) {
  return Boolean(error) && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || /quota|storage/i.test(String(error.message || '')));
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      try { localStorage.removeItem(key); } catch {}
      return false;
    }
    throw error;
  }
}

export function removeValue(key) {
  localStorage.removeItem(key);
}

export function versionedKey(key, version) {
  return `${key}:v${version}`;
}
