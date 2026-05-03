import { freezePricing, resolveCartPricing } from '../pricing/pricing.engine.js';

export function assertNoManualPricing(item) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('cart item must be an object');
  }

  if ('price' in item) {
    throw new Error('Manual pricing field detected on cart item');
  }

  if (!item.pricing || typeof item.pricing !== 'object') {
    throw new Error('Cart item is missing pricing snapshot');
  }

  if (!Number.isFinite(Number(item.pricing.unit)) || !Number.isFinite(Number(item.pricing.total))) {
    throw new Error('Cart item pricing snapshot is invalid');
  }

  if (!item.pricing.breakdown || typeof item.pricing.breakdown !== 'object') {
    throw new Error('Cart item pricing breakdown is missing');
  }
}

export function assertCartIntegrity(cart) {
  if (!Array.isArray(cart)) {
    throw new TypeError('cart must be an array');
  }

  for (const item of cart) {
    assertNoManualPricing(item);
  }

  return true;
}

export function attachFrozenPricing(item, pricing) {
  const next = {
    ...item,
    pricing: freezePricing(pricing),
  };
  assertNoManualPricing(next);
  return next;
}

export function normalizeLegacyCart(cart = [], context = {}) {
  return resolveCartPricing(cart, context);
}
