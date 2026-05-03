import { freezePricing, resolveCartPricing, resolvePrice } from '../pricing/pricing.engine.js';
import { assertCartIntegrity, assertNoManualPricing } from '../core/guards.js';

function toQuantity(value) {
  const n = Math.floor(Number(value || 1));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function lineId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `line_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function cartLineKey({ type = 'product', productId = '', id = '', unit = 'single' } = {}) {
  const resolvedId = String(productId || id || '').trim();
  return `${String(type || 'product')}:${resolvedId}:${String(unit || 'single')}`;
}

export function createCartSnapshot(input = {}, context = {}) {
  const type = String(input.type || 'product');
  const productId = String(input.productId || input.id || '').trim();
  const unit = String(input.unit || (type === 'product' ? 'carton' : 'single'));
  const quantity = toQuantity(input.quantity ?? input.qty ?? 1);
  const pricing = input.pricing && typeof input.pricing === 'object'
    ? freezePricing(input.pricing)
    : resolvePrice({
        product: input.product || context.product || null,
        productId,
        qty: quantity,
        unit,
        context,
        type,
        sourceItem: input,
      });

  const item = {
    id: String(input.id && String(input.id).includes(':') ? input.id : lineId()),
    key: String(input.key || cartLineKey({ type, productId, unit })),
    type,
    productId,
    quantity,
    qty: quantity,
    unit,
    title: input.title || input.name || '',
    company: input.company || '',
    image: input.image || '',
    unitLabel: input.unitLabel || (unit === 'pack' ? 'دستة' : unit === 'carton' ? 'كرتونة' : unit === 'single' ? 'قطعة' : unit),
    pricing,
  };

  if (input.product) item.product = input.product;
  assertNoManualPricing(item);
  return item;
}

function matchKey(item, key) {
  return String(item?.key || item?.id || '') === String(key || '');
}

function itemContext(context = {}, item = {}) {
  return {
    ...context,
    product: item.product || context.product || null,
    productId: item.productId || item.id || context.productId || null,
    tier: context.tier || context.selectedTier || null,
  };
}

export function addToCart(engine, cart, input, context = {}) {
  if (!engine || typeof engine.resolvePrice !== 'function') {
    throw new TypeError('pricing engine is required');
  }
  assertCartIntegrity(cart);
  const nextItem = createCartSnapshot(input, context);
  const idx = cart.findIndex((item) => matchKey(item, nextItem.key));
  if (idx >= 0) {
    const existing = cart[idx];
    const mergedQty = toQuantity(existing.quantity ?? existing.qty) + nextItem.quantity;
    const repriced = updateCartItem(engine, existing, mergedQty, itemContext(context, existing));
    cart[idx] = repriced;
    return repriced;
  }
  cart.push(nextItem);
  return nextItem;
}

export function updateCartItem(engine, item, qty, context = {}) {
  if (!engine || typeof engine.resolvePrice !== 'function') {
    throw new TypeError('pricing engine is required');
  }
  assertNoManualPricing(item);
  const nextQty = toQuantity(qty);
  const pricing = freezePricing(
    engine.resolvePrice({
      product: item.product || context.product || null,
      productId: item.productId || item.id,
      qty: nextQty,
      unit: item.unit,
      context,
      type: item.type,
      sourceItem: item,
    })
  );

  const next = {
    ...item,
    quantity: nextQty,
    qty: nextQty,
    pricing,
  };
  assertNoManualPricing(next);
  return next;
}

export function repriceCart(engine, cart, context = {}) {
  if (!engine || typeof engine.resolvePrice !== 'function') {
    throw new TypeError('pricing engine is required');
  }
  assertCartIntegrity(cart);
  return resolveCartPricing(cart.map((item) => {
    const next = { ...item };
    const qty = toQuantity(next.quantity ?? next.qty);
    const result = engine.resolvePrice({
      product: next.product || context.product || null,
      productId: next.productId || next.id,
      qty,
      unit: next.unit,
      context,
      type: next.type,
      sourceItem: next,
    });
    next.quantity = qty;
    next.qty = qty;
    next.pricing = freezePricing(result);
    if (!next.unitLabel) next.unitLabel = next.unit === 'pack' ? 'دستة' : next.unit === 'carton' ? 'كرتونة' : next.unit === 'single' ? 'قطعة' : next.unit;
    next.key = String(next.key || cartLineKey(next));
    next.id = String(next.id || lineId());
    return next;
  }), context);
}

export function normalizeCartState(engine, cart, context = {}) {
  if (!Array.isArray(cart)) return [];
  if (!engine || typeof engine.resolvePrice !== 'function') {
    throw new TypeError('pricing engine is required');
  }

  const migrated = cart.map((item) => {
    if (!item || typeof item !== 'object') return null;
    if ('price' in item) {
      const next = { ...item };
      delete next.price;
      return next;
    }
    return { ...item };
  }).filter(Boolean);

  const repriced = repriceCart(engine, migrated, context);
  repriced.forEach((item) => assertNoManualPricing(item));
  return repriced;
}

export function getCartTotals(cart = []) {
  assertCartIntegrity(cart);
  let products = 0;
  let deals = 0;
  let flash = 0;
  let base = 0;
  let tier = 0;
  let dealsDiscount = 0;
  let flashDiscount = 0;
  let final = 0;

  for (const item of cart) {
    const qty = Math.max(1, Math.floor(Number(item.quantity ?? item.qty ?? 1)) || 1);
    const lineTotal = Number(item.pricing?.total || 0);
    const breakdown = item.pricing?.breakdown || {};
    const lineBase = Number(breakdown.base || 0) * qty;
    const lineTier = Number(breakdown.tier || 0) * qty;
    const lineDeals = Number(breakdown.deals || 0) * qty;
    const lineFlash = Number(breakdown.flash || 0) * qty;
    const lineFinal = Number(breakdown.final ?? item.pricing?.unit ?? 0) * qty;

    if (String(item.type) === 'product') products += lineTotal;
    else if (String(item.type) === 'deal') deals += lineTotal;
    else if (String(item.type) === 'flash') flash += lineTotal;

    base += lineBase;
    tier += lineTier;
    dealsDiscount += lineDeals;
    flashDiscount += lineFlash;
    final += lineFinal;
  }

  const total = products + deals + flash;
  const snapshot = freezePricing({
    unit: total,
    total,
    breakdown: {
      base,
      tier,
      deals: dealsDiscount,
      flash: flashDiscount,
      final,
    },
    context: {
      tier: null,
      appliedDeals: [],
      flashId: null,
    },
    timestamp: Date.now(),
  });

  return {
    products,
    deals,
    flash,
    eligible: products,
    total,
    breakdown: {
      base,
      tier,
      deals: dealsDiscount,
      flash: flashDiscount,
      final,
    },
    snapshot,
  };
}
