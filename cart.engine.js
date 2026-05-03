import { resolvePrice, resolveCartPricing } from './pricing/pricing.engine.js';
import { assertCartIntegrity, normalizeLegacyCart } from './core/guards.js';
import { addToCart, updateCartItem, repriceCart, normalizeCartState, getCartTotals, cartLineKey } from './cart/cart.service.js';

export function lineTotal(item) {
  assertCartIntegrity([item]);
  return Number(item.pricing?.total || 0);
}

export function cartTotal(cart = []) {
  return getCartTotals(cart).total;
}

export function eligibleTierTotal(cart = []) {
  return getCartTotals(cart).eligible;
}

export function cartTotals(cart = []) {
  return getCartTotals(cart);
}

export {
  resolvePrice,
  resolveCartPricing,
  addToCart,
  updateCartItem,
  repriceCart,
  normalizeCartState,
  normalizeLegacyCart,
  cartLineKey,
};

const CART_ENGINE = Object.freeze({
  resolvePrice,
  resolveCartPricing,
  addToCart,
  updateCartItem,
  repriceCart,
  normalizeCartState,
  normalizeLegacyCart,
  cartLineKey,
  lineTotal,
  cartTotal,
  eligibleTierTotal,
  cartTotals,
});

if (typeof window !== 'undefined') {
  window.CART_ENGINE = CART_ENGINE;
}

export default CART_ENGINE;
