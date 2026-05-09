import { storageKeys, saveJSON } from '../core/storage.js';
import { asNumber, unitRank } from './contractUtils.js';

export function buildPriceBook(products, tiers, selectedTierName) {
  const tierName = selectedTierName || tiers.find((tier) => tier.is_default)?.tier_name || 'base';
  const book = {};

  for (const product of products || []) {
    const prices = {};
    for (const unit of product.units || []) {
      const code = String(unit.unit_code || '').trim();
      if (!code) continue;
      const price = asNumber(unit.final_price, 0);
      if (price > 0) prices[code] = Number(price.toFixed(2));
    }
    book[product.product_id] = {
      tierName,
      units: Object.keys(prices).sort((a, b) => unitRank(a) - unitRank(b)),
      prices,
      allowBackorder: (product.units || []).some((unit) => unit.allow_backorder),
    };
  }

  return book;
}

export function resolveProductUnit(product, preference = null) {
  const available = Array.isArray(product?.sellable_units) && product.sellable_units.length
    ? product.sellable_units
    : (Array.isArray(product?.units) ? product.units.map((item) => item.unit_code) : []);
  if (preference && available.includes(preference)) return preference;
  for (const candidate of ['carton', 'pack', 'half_pack', 'piece']) {
    if (available.includes(candidate)) return candidate;
  }
  return available[0] || 'piece';
}

function resolveUnitRow(product, unit) {
  const unitCode = unit || resolveProductUnit(product);
  if (Array.isArray(product?.units)) {
    const row = product.units.find((item) => String(item.unit_code) === String(unitCode));
    if (row) return row;
  }
  const legacyPrice = asNumber(product?.prices?.[unitCode], 0);
  if (legacyPrice > 0) {
    return {
      unit_code: unitCode,
      final_price: legacyPrice,
      available_qty: asNumber(product?.available_qty, 0),
      reserved_qty: asNumber(product?.reserved_qty, 0),
      minimum_sell_qty: asNumber(product?.minimum_sell_qty, 1) || 1,
      is_sellable: true,
      allow_backorder: true,
    };
  }
  return null;
}

export function resolvePrice(product, unit) {
  const row = resolveUnitRow(product, unit);
  if (!row) return null;
  const price = asNumber(row.final_price, 0);
  return price > 0 ? Number(price.toFixed(2)) : null;
}

export function computeDisplayPrice(product, unit) {
  const row = resolveUnitRow(product, unit);
  if (!row) return { base: null, final: null, unit: unit || resolveProductUnit(product), available_qty: 0, reserved_qty: 0, minimum_sell_qty: 1 };
  const price = asNumber(row.final_price, 0);
  return {
    base: Number(price.toFixed(2)),
    final: Number(price.toFixed(2)),
    unit: row.unit_code || unit || resolveProductUnit(product),
    available_qty: asNumber(row.available_qty, 0),
    reserved_qty: asNumber(row.reserved_qty, 0),
    minimum_sell_qty: asNumber(row.minimum_sell_qty, 1) || 1,
    is_sellable: row.is_sellable !== false,
  };
}

export function syncCartPrices(cart, productsById) {
  return (cart || []).map((item) => {
    if (item.type !== 'product') return item;
    const product = productsById?.[item.id];
    if (!product) return item;
    const unit = item.unit || resolveProductUnit(product, item.unit);
    const price = resolvePrice(product, unit);
    const unitRow = resolveUnitRow(product, unit);
    return {
      ...item,
      unit,
      price: price ?? Number(item.price || 0),
      companyId: product.company_id,
      companyName: product.company_name,
      image: product.product_image || item.image || '',
      unitLabel: labelForUnit(unit),
      snapshot: {
        tierName: item.snapshot?.tierName || product.tier_name || null,
        unit,
        basePrice: Number((price ?? item.price) || 0),
        availableQty: unitRow ? Number(unitRow.available_qty || 0) : 0,
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
