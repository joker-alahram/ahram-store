import { storageKeys, saveJSON } from '../core/storage.js';

function unitRank(unit) {
  return { carton: 1, pack: 2, half_pack: 3, piece: 4 }[unit] ?? 99;
}

function getUnitRecord(product, unit) {
  if (!product || !unit) return null;
  return product.units?.[unit] || null;
}

export function buildPriceBook(products, tiers, selectedTierName) {
  const tierName = selectedTierName || tiers.find((tier) => tier.is_default)?.tier_name || 'base';
  const book = {};

  for (const product of products) {
    const unitEntries = Object.entries(product.units || {})
      .filter(([, value]) => Number(value?.final_price ?? 0) > 0)
      .sort(([left], [right]) => unitRank(left) - unitRank(right));

    const prices = Object.fromEntries(
      unitEntries.map(([unit, value]) => [unit, Number(Number(value.final_price).toFixed(2))])
    );

    book[product.product_id] = {
      tierName,
      units: unitEntries.map(([unit]) => unit),
      prices,
      allowDiscount: true,
    };
  }

  return book;
}

export function resolveProductUnit(product, preference = null) {
  const available = Object.entries(product?.units || {})
    .filter(([, value]) => Number(value?.final_price ?? 0) > 0 && value?.unit_active !== false && value?.is_sellable !== false)
    .map(([unit]) => unit)
    .sort((a, b) => unitRank(a) - unitRank(b));
  if (preference && available.includes(preference)) return preference;
  return available[0] || 'carton';
}

export function resolvePrice(product, unit) {
  const unitCode = unit || resolveProductUnit(product);
  const record = getUnitRecord(product, unitCode);
  const price = Number(record?.final_price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  return Number(price.toFixed(2));
}

export function computeDisplayPrice(product, unit) {
  const record = getUnitRecord(product, unit || resolveProductUnit(product));
  const final = Number(record?.final_price ?? 0);
  return { base: final, final };
}

export function syncCartPrices(cart, productsById) {
  return cart.map((item) => {
    if (item.type !== 'product') return item;
    const product = productsById[item.id];
    if (!product) return item;
    const record = getUnitRecord(product, item.unit);
    const price = Number(record?.final_price ?? item.price ?? 0);
    return {
      ...item,
      price: price > 0 ? Number(price.toFixed(2)) : item.price,
      companyId: product.company_id,
      companyName: product.company_name,
      unitLabel: labelForUnit(item.unit),
      snapshot: {
        unit: item.unit,
        finalPrice: Number(record?.final_price ?? item.price ?? 0),
        availableQty: Number(record?.available_qty ?? 0),
        allowBackorder: record?.allow_backorder === true,
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
