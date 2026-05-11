import { storageKeys } from './storage.js';

export const THEME_OPTIONS = [
  { name: 'premium-dark', label: 'Premium Dark', swatch: 'linear-gradient(145deg, #181613 0%, #d4af37 100%)', metaColor: '#d4af37' },
  { name: 'premium-light', label: 'Premium Light', swatch: 'linear-gradient(145deg, #fbf7ef 0%, #c9b58c 100%)', metaColor: '#c9b58c' },
  { name: 'midnight-blue', label: 'Midnight Blue', swatch: 'linear-gradient(145deg, #081225 0%, #2f62d2 100%)', metaColor: '#2f62d2' },
  { name: 'emerald-green', label: 'Emerald Green', swatch: 'linear-gradient(145deg, #0b281b 0%, #25c26e 100%)', metaColor: '#25c26e' },
  { name: 'royal-purple', label: 'Royal Purple', swatch: 'linear-gradient(145deg, #23113d 0%, #8b5cf6 100%)', metaColor: '#8b5cf6' },
  { name: 'sunset-orange', label: 'Sunset Orange', swatch: 'linear-gradient(145deg, #4d1d00 0%, #ff7a18 100%)', metaColor: '#ff7a18' },
];

const THEME_SET = new Set(THEME_OPTIONS.map((item) => item.name));

export function normalizeThemeName(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return THEME_SET.has(normalized) ? normalized : 'premium-dark';
}

export function readStoredTheme() {
  try {
    return normalizeThemeName(localStorage.getItem(storageKeys.theme));
  } catch {
    return 'premium-dark';
  }
}

export function persistTheme(theme) {
  try {
    localStorage.setItem(storageKeys.theme, normalizeThemeName(theme));
  } catch {
    // ignore persistence failures
  }
}

export function themeMetaColor(theme) {
  return THEME_OPTIONS.find((item) => item.name === normalizeThemeName(theme))?.metaColor || '#d4af37';
}
