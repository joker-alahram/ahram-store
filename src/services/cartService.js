import { cartLineKey, isoNow } from './runtimeUtils.js';

export function addVariantToCart(cart, variant, qty = 1) {
  if (!variant) return cart;
  const nextQty = Math.max(1, Number(qty || 1));
  const line = {
    product_id: String(variant.product_id ?? '').trim(),
    product_name: String(variant.product_name ?? '').trim(),
    unit_code: String(variant.unit_code ?? '').trim(),
    final_price: Number(variant.final_price ?? 0),
    qty: nextQty,
    tier_name: String(variant.tier_name ?? '').trim(),
    snapshot: isoNow(),
  };
  const key = cartLineKey(line);
  const index = cart.findIndex((item) => cartLineKey(item) === key);
  if (index >= 0) {
    const updated = [...cart];
    updated[index] = { ...updated[index], qty: Number(updated[index].qty || 0) + nextQty, snapshot: isoNow() };
    return updated;
  }
  return [...cart, line];
}

export function updateCartQty(cart, lineKey, qty) {
  const nextQty = Math.max(1, Number(qty || 1));
  return cart.map((item) => cartLineKey(item) === lineKey ? { ...item, qty: nextQty, snapshot: isoNow() } : item);
}

export function removeCartLine(cart, lineKey) {
  return cart.filter((item) => cartLineKey(item) !== lineKey);
}

export function clearCart() {
  return [];
}

export function computeCartTotals(cart = []) {
  return cart.reduce((acc, item) => {
    const amount = Number(item.final_price || 0) * Number(item.qty || 0);
    acc.grand += amount;
    acc.count += Number(item.qty || 0);
    if (item.tier_name) acc.byTier[item.tier_name] = (acc.byTier[item.tier_name] || 0) + amount;
    return acc;
  }, { grand: 0, count: 0, byTier: {} });
}

export function cartKeyForVariant(variant) {
  return cartLineKey({ product_id: variant.product_id, unit_code: variant.unit_code, tier_name: variant.tier_name });
}
