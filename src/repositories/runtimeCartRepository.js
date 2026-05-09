import { loadJSON, saveJSON, storageKeys } from '../core/storage.js';

export function hydrateRuntimeCart() {
  const rows = loadJSON(storageKeys.cart, []);
  return Array.isArray(rows) ? rows : [];
}

export function persistRuntimeCart(cart) {
  saveJSON(storageKeys.cart, cart);
}

export function persistRuntimeTier(tierName) {
  saveJSON(storageKeys.tier, tierName);
}

export function persistRuntimeUnitPrefs(map) {
  saveJSON(storageKeys.unitPrefs, map);
}

export function persistRuntimeQtyPrefs(map) {
  saveJSON(storageKeys.qtyPrefs, map);
}

export function persistRuntimeCustomer(customer) {
  if (customer) saveJSON(storageKeys.customer, customer);
  else localStorage.removeItem(storageKeys.customer);
}
