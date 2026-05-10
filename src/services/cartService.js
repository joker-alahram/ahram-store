import { storageKeys, saveJSON } from '../core/storage.js';
import { labelForUnit, resolvePrice, resolveProductUnit, normalizeTierName } from './pricingService.js';

export function hydrateCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKeys.cart) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function persistCart(cart) {
  saveJSON(storageKeys.cart, cart);
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
  const existing = (Array.isArray(cart) ? cart : []).find((item) => item.key === key);
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
    if (!product) return item;
    const unitRecord = product.units?.[item.unit] || null;
    const price = resolvePrice(product, item.unit);
    return {
      ...item,
      price: Number(price || item.price || 0),
      companyId: product.company_id,
      companyName: product.company_name,
      unitLabel: labelForUnit(item.unit),
      tierName: normalizeTierName(unitRecord?.tier_name || item.tierName || null),
    };
  });
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
