import { KIND } from './pricing-engine/types.js';
import { PricingError, ERROR_CODES } from './pricing-engine/errors.js';
import { normalizeKind, normalizeProductId, normalizeQty, normalizeTierName, normalizeUnit, clampMoney } from './pricing-engine/validators.js';

function cartKey(item) {
  return [
    normalizeProductId(item.productId),
    normalizeKind(item.kind || item.type),
    normalizeUnit(item.unit || 'pack'),
    normalizeTierName(item.tierName || '') || '',
  ].join('|');
}

function sumQty(a, b) {
  return normalizeQty(a) + normalizeQty(b);
}

export function cartTotals(cart = []) {
  const safeCart = Array.isArray(cart) ? cart : [];
  const totals = {
    total: 0,
    eligible: 0,
    products: 0,
    deals: 0,
    flash: 0,
  };

  for (const item of safeCart) {
    const type = normalizeKind(item.kind || item.type);
    const lineTotal = Number(item.total ?? (Number(item.price) * Number(item.qty)));
    const safeLineTotal = Number.isFinite(lineTotal) ? clampMoney(lineTotal) : 0;
    totals.total += safeLineTotal;
    if (type === KIND.PRODUCT) totals.products += safeLineTotal;
    if (type === KIND.DEAL) totals.deals += safeLineTotal;
    if (type === KIND.FLASH) totals.flash += safeLineTotal;
    if (type === KIND.PRODUCT) totals.eligible += safeLineTotal;
  }

  totals.total = clampMoney(totals.total);
  totals.products = clampMoney(totals.products);
  totals.deals = clampMoney(totals.deals);
  totals.flash = clampMoney(totals.flash);
  totals.eligible = clampMoney(totals.eligible);
  return totals;
}

export function createCartEngine({ resolvePrice }) {
  if (typeof resolvePrice !== 'function') {
    throw new Error('createCartEngine requires resolvePrice');
  }

  async function repriceCart(cart = [], context = {}) {
    const safeCart = Array.isArray(cart) ? cart : [];
    const next = [];

    for (const item of safeCart) {
      const kind = normalizeKind(item.kind || item.type);
      const priced = await resolvePrice({
        productId: item.productId ?? item.id,
        qty: normalizeQty(item.qty),
        unit: item.unit,
        tierName: item.tierName ?? context.tierName ?? null,
        kind,
        context: {
          ...context,
          kind,
          eligibleTotal: context.eligibleTotal,
          cartEligibleTotal: context.cartEligibleTotal,
        },
      });

      next.push({
        ...item,
        kind,
        type: kind,
        price: priced.unitPrice,
        unitPrice: priced.unitPrice,
        total: priced.total,
        currency: priced.currency,
        breakdown: priced.breakdown,
        meta: priced.meta,
      });
    }

    return next;
  }

  async function addToCart(cart = [], item = {}, context = {}) {
    const safeCart = Array.isArray(cart) ? [...cart] : [];
    const kind = normalizeKind(item.kind || item.type);
    const productId = normalizeProductId(item.productId ?? item.id);
    const qty = normalizeQty(item.qty ?? 1);
    const unit = normalizeUnit(item.unit || 'pack');
    const tierName = normalizeTierName(item.tierName ?? context.tierName ?? null);

    const priced = await resolvePrice({
      productId,
      qty,
      unit,
      tierName,
      kind,
      context: {
        ...context,
        kind,
      },
    });

    const incoming = {
      ...item,
      productId,
      id: item.id ?? productId,
      qty,
      unit,
      tierName,
      kind,
      type: kind,
      price: priced.unitPrice,
      unitPrice: priced.unitPrice,
      total: priced.total,
      currency: priced.currency,
      breakdown: priced.breakdown,
      meta: priced.meta,
    };

    const key = cartKey(incoming);
    const idx = safeCart.findIndex((entry) => cartKey(entry) === key);
    if (idx >= 0) {
      const existing = safeCart[idx];
      const mergedQty = sumQty(existing.qty, incoming.qty);
      const merged = await resolvePrice({
        productId,
        qty: mergedQty,
        unit,
        tierName,
        kind,
        context: {
          ...context,
          kind,
        },
      });
      safeCart[idx] = {
        ...existing,
        ...incoming,
        qty: mergedQty,
        price: merged.unitPrice,
        unitPrice: merged.unitPrice,
        total: merged.total,
        currency: merged.currency,
        breakdown: merged.breakdown,
        meta: merged.meta,
      };
      return safeCart;
    }

    safeCart.push(incoming);
    return safeCart;
  }

  function removeFromCart(cart = [], item) {
    const safeCart = Array.isArray(cart) ? [...cart] : [];
    const key = cartKey(item);
    return safeCart.filter((entry) => cartKey(entry) !== key);
  }

  function updateQty(cart = [], item, qty) {
    const safeCart = Array.isArray(cart) ? [...cart] : [];
    const key = cartKey(item);
    const index = safeCart.findIndex((entry) => cartKey(entry) === key);
    if (index < 0) return safeCart;
    const nextQty = normalizeQty(qty);
    safeCart[index] = { ...safeCart[index], qty: nextQty };
    return safeCart;
  }

  function clearCart() {
    return [];
  }

  async function validateCart(cart = [], context = {}) {
    const repriced = await repriceCart(cart, context);
    const totals = cartTotals(repriced);
    return { cart: repriced, totals };
  }

  return {
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    repriceCart,
    validateCart,
    cartTotals,
  };
}
