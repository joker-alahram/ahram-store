import { storageKeys, saveJSON } from '../core/storage.js';
import { isOfferActive } from './offerService.js';
import { labelForUnit, resolvePrice, resolveProductUnit, normalizeTierName } from './pricingService.js';

function safeParseCart(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hydrateCart() {
  return safeParseCart(localStorage.getItem(storageKeys.cart));
}

export function persistCart(cart) {
  saveJSON(storageKeys.cart, cart);
}

export function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}

function normalizeOfferUnit(offer) {
  const unit = String(offer?.unit_code || offer?.unit || offer?.bundle_unit || '').trim();
  if (unit && ['carton', 'pack', 'half_pack', 'piece'].includes(unit)) return unit;
  return offer?.type === 'flash' ? 'piece' : 'piece';
}

function normalizeOfferProductId(offer) {
  return String(offer?.product_id || offer?.productId || offer?.source_product_id || offer?.bundle_product_id || offer?.id || '').trim();
}

function buildOfferProductId(kind, offer) {
  const baseId = normalizeOfferProductId(offer) || String(offer?.id || '').trim();
  const prefix = kind === 'flash' ? 'flash' : 'deal';
  return baseId ? `${prefix}:${baseId}` : `${prefix}:unknown`;
}

export function addProductToCart(cart, product, tier, unitPreference, quantity = 1) {
  if (!product?.product_id) return { cart: Array.isArray(cart) ? cart : [], added: false, key: null, reason: 'INVALID_PRODUCT' };
  const unit = resolveProductUnit(product, unitPreference);
  const price = resolvePrice(product, unit, tier);
  if (!unit || !price) {
    return { cart: Array.isArray(cart) ? cart : [], added: false, key: null, reason: 'UNSELLABLE_PRODUCT' };
  }
  const safeCart = Array.isArray(cart) ? cart : [];
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const existing = safeCart.find((item) => item.key === key);
  if (existing) return { cart: safeCart.filter((item) => item.key !== key), added: false, key };

  const unitRecord = product.units?.[unit] || null;
  const next = [...safeCart, {
    key,
    type: 'product',
    id: product.product_id,
    product_id: product.product_id,
    title: product.product_name,
    image: product.product_image || '',
    companyId: product.company_id,
    companyName: product.company_name,
    unit,
    unit_code: unit,
    unitLabel: labelForUnit(unit),
    qty: Math.max(1, Number(quantity || 1)),
    price: Number(price || 0),
    tierName: normalizeTierName(tier?.tier_name || unitRecord?.tier_name || null),
  }];
  return { cart: next, added: true, key };
}

export function toggleOfferInCart(cart, offer, kind) {
  const isActive = isOfferActive(offer);
  if (kind === 'flash' && !isActive) {
    return { cart: Array.isArray(cart) ? cart : [], added: false, key: `${kind}:${offer?.id}:single`, reason: 'OFFER_EXPIRED' };
  }
  const safeCart = Array.isArray(cart) ? cart : [];
  const key = `${kind}:${offer.id}:single`;
  const existing = safeCart.find((item) => item.key === key);
  if (existing) return { cart: safeCart.filter((item) => item.key !== key), added: false, key };

  const sourceProductId = normalizeOfferProductId(offer);
  const unit = kind === 'flash' ? 'bundle' : normalizeOfferUnit(offer);
  return {
    cart: [...safeCart, {
      key,
      type: kind,
      id: offer.id,
      offer_id: offer.id,
      source_product_id: sourceProductId || null,
      product_id: kind === 'flash' ? null : buildOfferProductId(kind, offer),
      runtime_status: String(offer?.runtime_status || offer?.status || '').trim().toLowerCase(),
      is_checkout_available: offer?.is_checkout_available !== false,
      title: offer.title,
      image: offer.image || '',
      companyId: offer.company_id || null,
      companyName: kind === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
      unit,
      unit_code: kind === 'flash' ? 'FLASH_BUNDLE' : unit,
      unitLabel: labelForUnit(unit),
      qty: 1,
      price: Number(offer.price || 0),
      pricing_source: kind,
      tierName: normalizeTierName(offer.tier_name || null),
      package_details: offer.description || '',
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
    if (item.type !== 'product') return item;
    const product = productsById?.[item.id] || productsById?.[item.product_id];
    if (!product) return item;
    const resolvedUnit = resolveProductUnit(product, item.unit || item.unit_code);
    const unitRecord = product.units?.[resolvedUnit] || null;
    const price = resolvePrice(product, resolvedUnit);
    if (!resolvedUnit || !price) return item;
    return {
      ...item,
      id: product.product_id,
      product_id: product.product_id,
      unit: resolvedUnit,
      unit_code: resolvedUnit,
      price: Number(price.toFixed(2)),
      companyId: product.company_id,
      companyName: product.company_name,
      unitLabel: labelForUnit(resolvedUnit),
      tierName: normalizeTierName(unitRecord?.tier_name || item.tierName || null),
    };
  }).filter(Boolean);
}

export function computeTotals(cart) {
  return (Array.isArray(cart) ? cart : []).reduce((acc, item) => {
    const line = Number(item.price || 0) * Number(item.qty || 0);
    acc.grand += line;
    if (item.type === 'product') acc.products += line;
    if (item.type === 'deal') acc.deals += line;
    if (item.type === 'flash') acc.flash += line;
    return acc;
  }, { grand: 0, products: 0, deals: 0, flash: 0, count: 0 });
}
