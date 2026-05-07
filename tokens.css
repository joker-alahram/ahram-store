import { storageKeys, saveJSON } from '../core/storage.js';

function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[unit] ?? 99;
}

export function buildPriceBook(products, tiers, selectedTierName) {
  const tierName = selectedTierName || tiers.find((tier) => tier.is_default)?.tier_name || 'base';
  const book = {};

  for (const product of products) {
    const units = ['carton', 'pack', 'half_pack', 'piece'];
    const priceMap = {};
    for (const unit of units) {
      const value = Number(product.prices?.[unit] ?? 0);
      if (value > 0) priceMap[unit] = Number(value.toFixed(2));
    }
    book[product.product_id] = {
      tierName,
      units: Object.keys(priceMap).sort((a, b) => unitRank(a) - unitRank(b)),
      prices: priceMap,
      allowDiscount: product.allow_discount !== false,
    };
  }

  return book;
}

export function resolveProductUnit(product, preference = null) {
  const available = Array.isArray(product.sellable_units) ? product.sellable_units : [];
  if (preference && available.includes(preference)) return preference;
  for (const candidate of ['carton', 'pack', 'half_pack', 'piece']) {
    if (available.includes(candidate) && Number(product.prices?.[candidate] ?? 0) > 0) return candidate;
  }
  return available[0] || 'carton';
}

export function resolvePrice(product, unit, tier = null) {
  const unitCode = unit || resolveProductUnit(product);
  const price = Number(product.prices?.[unitCode] ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (unitCode === 'carton' && tier && tier.discount_percent > 0 && product.allow_discount !== false) {
    const discounted = Number((price * (1 - Number(tier.discount_percent) / 100)).toFixed(2));
    return discounted > 0 ? discounted : null;
  }
  return Number(price.toFixed(2));
}

export function computeDisplayPrice(product, unit, tier) {
  const base = Number(product.prices?.[unit] ?? 0);
  const final = resolvePrice(product, unit, tier);
  return { base, final };
}

export function syncCartPrices(cart, productsById, tier) {
  return cart.map((item) => {
    if (item.type !== 'product') return item;
    const product = productsById[item.id];
    if (!product) return item;
    const price = resolvePrice(product, item.unit, tier);
    return {
      ...item,
      price: price ?? item.price,
      companyId: product.company_id,
      companyName: product.company_name,
      unitLabel: labelForUnit(item.unit),
      snapshot: {
        tierName: tier?.tier_name || null,
        unit: item.unit,
        basePrice: Number(product.prices?.[item.unit] ?? 0),
      },
    };
  });
}

export function labelForUnit(unit) {
  return {
    carton: 'كرتونة',
    pack: 'دستة',
    half_pack: 'نصف دستة',
    piece: 'قطعة',
  }[unit] || unit || 'قطعة';
}

export function persistSelectedTier(tierName) {
  localStorage.setItem(storageKeys.tier, JSON.stringify(tierName));
}

export function persistPriceBook(book) {
  saveJSON(storageKeys.cache, { ...(JSON.parse(localStorage.getItem(storageKeys.cache) || '{}')), priceBook: book });
}
