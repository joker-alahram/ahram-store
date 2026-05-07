import { storageKeys, saveJSON } from '../core/storage.js';
import { getUnitPrice, labelForUnit, resolveProductUnit } from './pricingService.js';

const VALID_UNITS = new Set(['carton', 'pack', 'half_pack', 'piece', 'single']);

function money(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function buildKey(productId, unitCode, tierName) {
  return `${String(productId || '').trim()}::${String(unitCode || 'single').trim()}::${String(tierName || '').trim()}`;
}

function inferOfferKind(productId) {
  const value = String(productId || '').trim();
  if (value.startsWith('deal:')) return 'deal';
  if (value.startsWith('flash:')) return 'flash';
  return 'product';
}

function normalizeUnit(unitCode) {
  const value = String(unitCode || '').trim();
  return VALID_UNITS.has(value) ? value : 'single';
}

function normalizeItem(item, productsById = {}, fallbackTierName = null) {
  const legacyProductId = String(item?.productId ?? item?.id ?? item?.product_id ?? '').trim();
  const productId = legacyProductId || '';
  const inferredKind = inferOfferKind(productId);
  const product = productsById[productId] || productsById[String(item?.id ?? '')] || null;
  const unitCode = normalizeUnit(item?.unitCode ?? item?.unit ?? 'single');
  const tierName = String(item?.tierName ?? item?.snapshot?.tierName ?? fallbackTierName ?? '').trim() || null;
  const qty = Math.max(1, Math.trunc(Number(item?.qty ?? 1)) || 1);
  const finalPriceCandidate = Number(item?.finalPrice ?? item?.price ?? item?.resolvedPrice ?? item?.snapshot?.finalPrice ?? NaN);
  const finalPrice = Number.isFinite(finalPriceCandidate) && finalPriceCandidate >= 0
    ? money(finalPriceCandidate)
    : money(
        inferredKind === 'product' && product
          ? getUnitPrice(product, unitCode === 'single' ? resolveProductUnit(product) : unitCode)
          : Number(item?.price ?? 0),
      );
  const productName = String(item?.productName ?? item?.title ?? item?.name ?? product?.product_name ?? '').trim();

  return {
    productId,
    productName,
    unitCode,
    qty,
    finalPrice,
    tierName,
    snapshotTimestamp: String(item?.snapshotTimestamp ?? item?.snapshot?.timestamp ?? new Date().toISOString()),
  };
}

export function cartItemKey(item) {
  return buildKey(item?.productId, item?.unitCode, item?.tierName);
}

export function findCartItemByKey(cart, key) {
  return Array.isArray(cart) ? cart.find((item) => cartItemKey(item) === key) || null : null;
}

export function normalizeCartItems(items, productsById = {}, fallbackTierName = null) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => normalizeItem(item, productsById, fallbackTierName))
    .filter((item) => item.productId && item.productName);
}

export function hydrateCart(productsById = {}, fallbackTierName = null) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeys.cart) || '[]');
    return normalizeCartItems(Array.isArray(parsed) ? parsed : [], productsById, fallbackTierName);
  } catch {
    return [];
  }
}

export function persistCart(cart) {
  saveJSON(storageKeys.cart, Array.isArray(cart) ? cart : []);
}

export function addProductToCart(cart, product, tier, unitPreference, quantity = 1) {
  const tierName = String(tier?.tier_name || '').trim() || null;
  const unitCode = resolveProductUnit(product, unitPreference);
  if (!unitCode) return { cart: Array.isArray(cart) ? [...cart] : [], added: false, key: null };
  const finalPrice = getUnitPrice(product, unitCode);
  if (finalPrice === null) return { cart: Array.isArray(cart) ? [...cart] : [], added: false, key: null };

  const nextItem = {
    productId: String(product.product_id || '').trim(),
    productName: String(product.product_name || '').trim(),
    unitCode,
    qty: Math.max(1, Math.trunc(Number(quantity || 1)) || 1),
    finalPrice: money(finalPrice),
    tierName,
    snapshotTimestamp: new Date().toISOString(),
  };
  const key = cartItemKey(nextItem);
  const existing = Array.isArray(cart) ? cart.some((item) => cartItemKey(item) === key) : false;
  const nextCart = existing ? (Array.isArray(cart) ? cart.filter((item) => cartItemKey(item) !== key) : []) : [...(Array.isArray(cart) ? cart : []), nextItem];
  return { cart: nextCart, added: !existing, key };
}

export function toggleOfferInCart(cart, offer, kind, tierName = null) {
  const nextItem = {
    productId: `${kind}:${String(offer?.id ?? '').trim()}`,
    productName: String(offer?.title || '').trim(),
    unitCode: 'single',
    qty: 1,
    finalPrice: money(offer?.price ?? 0),
    tierName: null,
    snapshotTimestamp: new Date().toISOString(),
  };
  const key = cartItemKey(nextItem);
  const existing = Array.isArray(cart) ? cart.some((item) => cartItemKey(item) === key) : false;
  const nextCart = existing ? (Array.isArray(cart) ? cart.filter((item) => cartItemKey(item) !== key) : []) : [...(Array.isArray(cart) ? cart : []), nextItem];
  return { cart: nextCart, added: !existing, key };
}

export function updateQty(cart, key, qty) {
  const nextQty = Math.max(1, Math.trunc(Number(qty || 1)) || 1);
  return (Array.isArray(cart) ? cart : []).map((item) => (cartItemKey(item) === key ? { ...item, qty: nextQty } : item));
}

export function removeItem(cart, key) {
  return (Array.isArray(cart) ? cart : []).filter((item) => cartItemKey(item) !== key);
}

export function clearCart() {
  saveJSON(storageKeys.cart, []);
  return [];
}

export function computeTotals(cart) {
  return (Array.isArray(cart) ? cart : []).reduce((acc, item) => {
    const line = money(item.finalPrice) * Math.max(1, Math.trunc(Number(item.qty || 1)) || 1);
    acc.grand += line;
    const kind = inferOfferKind(item.productId);
    if (kind === 'deal') acc.deals += line;
    else if (kind === 'flash') acc.flash += line;
    else acc.products += line;
    acc.count += Math.max(1, Math.trunc(Number(item.qty || 1)) || 1);
    return acc;
  }, { grand: 0, products: 0, deals: 0, flash: 0, count: 0 });
}
