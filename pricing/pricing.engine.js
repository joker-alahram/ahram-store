export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function normalizeTierName(tier) {
  if (!tier) return null;
  if (typeof tier === 'string') return tier.trim() || null;
  return String(tier.tier_name || tier.name || tier.tier || '').trim() || null;
}

export function buildTierPriceKey(tierName, productId) {
  const tier = normalizeTierName(tierName);
  const pid = String(productId || '').trim();
  return tier && pid ? `${tier}::${pid}` : '';
}

export function freezePricing(snapshot) {
  const pricing = {
    unit: toNumber(snapshot?.unit, 0),
    total: toNumber(snapshot?.total, 0),
    breakdown: {
      base: toNumber(snapshot?.breakdown?.base, 0),
      tier: toNumber(snapshot?.breakdown?.tier, 0),
      deals: toNumber(snapshot?.breakdown?.deals, 0),
      flash: toNumber(snapshot?.breakdown?.flash, 0),
      final: toNumber(snapshot?.breakdown?.final, 0),
    },
    context: {
      tier: snapshot?.context?.tier ?? null,
      appliedDeals: Array.isArray(snapshot?.context?.appliedDeals) ? [...snapshot.context.appliedDeals] : [],
      flashId: snapshot?.context?.flashId ?? null,
    },
    timestamp: Number.isFinite(Number(snapshot?.timestamp)) ? Number(snapshot.timestamp) : Date.now(),
  };

  Object.freeze(pricing.breakdown);
  Object.freeze(pricing.context);
  return Object.freeze(pricing);
}

function pickProduct(context = {}, productId) {
  const id = String(productId || '').trim();
  if (!id) return null;

  const maps = [
    context.productsById,
    context.productMap,
    context.products,
  ];

  for (const candidate of maps) {
    if (!candidate) continue;
    if (candidate instanceof Map && candidate.has(id)) return candidate.get(id);
    if (Array.isArray(candidate)) {
      const found = candidate.find((row) => String(row?.product_id ?? row?.id ?? row?.productId ?? '').trim() === id);
      if (found) return found;
    } else if (typeof candidate === 'object') {
      const direct = candidate[id] || candidate[Number(id)];
      if (direct) return direct;
    }
  }
  return null;
}

function pickTier(context = {}) {
  const raw = context.selectedTier ?? context.tier ?? context.tierRow ?? null;
  if (!raw) return null;
  if (typeof raw === 'string') return { tier_name: raw };
  return raw;
}

function pickTierPrice(context = {}, unit, productId) {
  const tierName = normalizeTierName(pickTier(context));
  if (!tierName) return null;
  const key = buildTierPriceKey(tierName, productId);
  const tierPrices = context.tierPrices || null;
  const unitMaps = [
    unit === 'pack' ? tierPrices?.pack : tierPrices?.carton,
    unit === 'carton' ? tierPrices?.carton : tierPrices?.pack,
  ];

  for (const map of unitMaps) {
    if (!map) continue;
    if (map instanceof Map && key && map.has(key)) {
      const price = toNumber(map.get(key), 0);
      if (price > 0) return price;
    }
    if (typeof map === 'object' && key && map[key] !== undefined) {
      const price = toNumber(map[key], 0);
      if (price > 0) return price;
    }
  }

  return null;
}

function basePriceForProduct(product, unit) {
  const isPack = String(unit || '') === 'pack';
  const cartonPrice = toNumber(product?.carton_price ?? product?.price_carton ?? product?.base_carton_price ?? product?.price, 0);
  const packPrice = toNumber(product?.pack_price ?? product?.base_pack_price ?? product?.pack, 0);
  return isPack ? packPrice : cartonPrice;
}

function allowedDiscount(product, unit) {
  if (!product) return true;
  const isPack = String(unit || '') === 'pack';
  if (isPack && product.discount_pack === false) return false;
  if (!isPack && product.discount_carton === false) return false;
  return product.allow_discount !== false;
}

function resolveProductPricing({ product, productId, qty = 1, unit = 'carton', context = {}, type = 'product', sourceItem = null }) {
  const quantity = Math.max(1, Math.floor(toNumber(qty, 1)));
  const itemType = String(type || 'product');
  const offer = sourceItem || (itemType === 'deal' || itemType === 'flash' ? pickProduct(context, productId) : null);

  if (itemType === 'deal' || itemType === 'flash') {
    const direct = toNumber(offer?.price ?? sourceItem?.price ?? product?.price, 0);
    return freezePricing({
      unit: direct,
      total: direct * quantity,
      breakdown: {
        base: direct,
        tier: 0,
        deals: itemType === 'deal' ? 0 : 0,
        flash: itemType === 'flash' ? 0 : 0,
        final: direct,
      },
      context: {
        tier: normalizeTierName(pickTier(context)),
        appliedDeals: [],
        flashId: itemType === 'flash' ? String(offer?.id ?? sourceItem?.id ?? productId ?? '') : null,
      },
      timestamp: Date.now(),
    });
  }

  const resolvedProduct = product || pickProduct(context, productId);
  const base = basePriceForProduct(resolvedProduct, unit);
  const tierPrice = pickTierPrice(context, unit, productId);
  const tier = pickTier(context);
  const tierPercent = toNumber(tier?.discount_percent, 0);

  let final = base;
  let tierAmount = 0;

  if (tierPrice && tierPrice > 0) {
    final = tierPrice;
    tierAmount = Math.max(0, base - tierPrice);
  } else if (base > 0 && tierPercent > 0 && allowedDiscount(resolvedProduct, unit)) {
    final = Number((base * (1 - tierPercent / 100)).toFixed(2));
    tierAmount = Math.max(0, base - final);
  }

  return freezePricing({
    unit: final,
    total: final * quantity,
    breakdown: {
      base,
      tier: tierAmount,
      deals: 0,
      flash: 0,
      final,
    },
    context: {
      tier: normalizeTierName(tier),
      appliedDeals: [],
      flashId: null,
    },
    timestamp: Date.now(),
  });
}

export function resolvePrice(input = {}) {
  return resolveProductPricing(input);
}

export function resolveCartPricing(cart = [], context = {}) {
  return (Array.isArray(cart) ? cart : []).map((item) => {
    const productId = String(item?.productId ?? item?.id ?? '').trim();
    const type = String(item?.type || 'product');
    const unit = String(item?.unit || (type === 'product' ? 'carton' : 'single'));
    const qty = Number(item?.quantity ?? item?.qty ?? 1);
    const pricing = item?.pricing && typeof item.pricing === 'object'
      ? freezePricing(item.pricing)
      : resolveProductPricing({
          product: item?.product || null,
          productId,
          qty,
          unit,
          context,
          type,
          sourceItem: item,
        });

    const next = {
      ...clone(item),
      id: String(item?.id || item?.key || `${type}:${productId}:${unit}:${Date.now()}`),
      key: String(item?.key || `${type}:${productId}:${unit}`),
      productId,
      quantity: Math.max(1, Math.floor(toNumber(item?.quantity ?? item?.qty, 1))),
      qty: Math.max(1, Math.floor(toNumber(item?.quantity ?? item?.qty, 1))),
      unit,
      type,
      pricing,
    };

    if (!next.unitLabel) {
      next.unitLabel = unit === 'pack' ? 'دستة' : unit === 'carton' ? 'كرتونة' : unit === 'single' ? 'قطعة' : unit;
    }

    return next;
  });
}
