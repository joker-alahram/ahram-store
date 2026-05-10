import { storageKeys, saveJSON } from '../core/storage.js';
import { labelForUnit, resolvePrice, resolveProductUnit, normalizeTierName } from './pricingService.js';

function normalizePersistedItem(item) {
  if (!item || typeof item !== 'object') return null;
  const type = String(item.type || '').trim();
  const id = item.id ?? item.product_id ?? null;
  if (!type || id === null || id === undefined) return null;
  return {
    key: String(item.key || `${type}:${id}:${item.unit || item.unit_code || 'single'}`),
    type,
    id,
    unit: item.unit || item.unit_code || 'single',
    qty: Math.max(1, Number(item.qty || 1)),
    tierName: normalizeTierName(item.tierName || item.tier_name || null),
  };
}

export function hydrateCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKeys.cart) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizePersistedItem).filter(Boolean);
  } catch {
    return [];
  }
}

export function persistCart(cart) {
  const minimized = (Array.isArray(cart) ? cart : [])
    .map(normalizePersistedItem)
    .filter(Boolean);
  saveJSON(storageKeys.cart, minimized);
}

export function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}

export function addProductToCart(cart, product, tier, unitPreference, quantity = 1) {
  if (!product?.product_id) return { cart: Array.isArray(cart) ? cart : [], added: false, key: null };
  const unit = resolveProductUnit(product, unitPreference);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const existing = (Array.isArray(cart) ? cart : []).find((item) => item.key === key);
  if (existing) return { cart: cart.filter((item) => item.key !== key), added: false, key };

  const price = resolvePrice(product, unit, tier);
  const unitRecord = product.units?.[unit] || null;
  if (!Number(price || 0) || !unitRecord) return { cart: Array.isArray(cart) ? cart : [], added: false, key: null };

  const next = [...cart, {
    key,
    type: 'product',
    id: product.product_id,
    unit,
    qty: Math.max(1, Number(quantity || 1)),
    tierName: normalizeTierName(tier?.tier_name || unitRecord?.tier_name || null),
  }];
  return { cart: next, added: true, key };
}

export function toggleOfferInCart(cart, offer, kind) {
  const key = `${kind}:${offer.id}:single`;
  const existing = (Array.isArray(cart) ? cart : []).find((item) => item.key === key);
  if (existing) return { cart: cart.filter((item) => item.key !== key), added: false, key };
  return {
    cart: [...cart, {
      key,
      type: kind,
      id: offer.id,
      unit: 'single',
      qty: 1,
      tierName: null,
    }],
    added: true,
    key,
  };
}

export function updateQty(cart, key, qty) {
  return (Array.isArray(cart) ? cart : []).map((item) => item.key === key ? { ...item, qty: Math.max(1, Number(qty || 1)) } : item);
}

export function removeItem(cart, key) {
  return (Array.isArray(cart) ? cart : []).filter((item) => item.key !== key);
}

export function clearCart() {
  saveJSON(storageKeys.cart, []);
  return [];
}

export function recalcCart(cart, productsById) {
  return (Array.isArray(cart) ? cart : []).map((item) => {
    if (item.type !== 'product') return {
      ...item,
      title: item.title || (item.type === 'deal' ? 'صفقة اليوم' : item.type === 'flash' ? 'عرض الساعة' : ''),
      image: item.image || '',
      unitLabel: item.unitLabel || labelForUnit(item.unit || item.unit_code || 'piece'),
      price: Number(item.price || 0),
    };

    const product = productsById?.[item.id];
    if (!product) return item;
    const unitCode = item.unit || item.unit_code || resolveProductUnit(product);
    const unitRecord = product.units?.[unitCode] || null;
    const price = resolvePrice(product, unitCode);
    if (!unitRecord || !Number(price || 0) || unitRecord.runtime_healthy === false || unitRecord.unit_active === false || unitRecord.is_sellable === false) {
      return null;
    }
    return {
      ...item,
      id: product.product_id,
      title: product.product_name,
      image: product.product_image || '',
      companyId: product.company_id,
      companyName: product.company_name,
      unit: unitCode,
      unitLabel: labelForUnit(unitCode),
      qty: Math.max(1, Number(item.qty || 1)),
      price: Number(price || 0),
      tierName: normalizeTierName(unitRecord?.tier_name || item.tierName || null),
    };
  }).filter(Boolean);
}

export function computeTotals(cart) {
  return (Array.isArray(cart) ? cart : []).reduce((acc, item) => {
    const qty = Number(item.qty || 0);
    const line = Number(item.price || 0) * qty;
    acc.grand += line;
    if (item.type === 'product') acc.products += line;
    if (item.type === 'deal') acc.deals += line;
    if (item.type === 'flash') acc.flash += line;
    acc.count += qty;
    return acc;
  }, { grand: 0, products: 0, deals: 0, flash: 0, count: 0 });
}
