import { storageKeys, saveJSON } from '../core/storage.js';
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
    title: product.product_name,
    image: product.product_image || '',
    companyId: product.company_id,
    companyName: product.company_name,
    unit,
    unitLabel: labelForUnit(unit),
    qty: Math.max(1, Number(quantity || 1)),
    price: Number(price || 0),
    tierName: normalizeTierName(tier?.tier_name || unitRecord?.tier_name || null),
  }];
  return { cart: next, added: true, key };
}

export function toggleOfferInCart(cart, offer, kind) {
  const key = `${kind}:${offer.id}:single`;
  const existing = cart.find((item) => item.key === key);
  if (existing) return { cart: cart.filter((item) => item.key !== key), added: false, key };
  return {
    cart: [...cart, {
      key,
      type: kind,
      id: offer.id,
      title: offer.title,
      image: offer.image || '',
      companyId: offer.company_id || null,
      companyName: kind === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
      unit: 'single',
      unitLabel: 'قطعة',
      qty: 1,
      price: Number(offer.price || 0),
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
    const product = productsById?.[item.id];
    if (!product) return null;
    const resolvedUnit = resolveProductUnit(product, item.unit);
    const unitRecord = product.units?.[resolvedUnit] || null;
    const price = resolvePrice(product, resolvedUnit);
    if (!resolvedUnit || !price) return null;
    return {
      ...item,
      unit: resolvedUnit,
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
