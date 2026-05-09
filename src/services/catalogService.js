import { priceFromRuntimeRow } from './pricingService.js';

export function normalizeProducts(rows = []) {
  return rows
    .filter((row) => row && row.runtime_healthy !== false && Number(row.final_price || 0) > 0)
    .map((row) => ({
      ...row,
      final_price: priceFromRuntimeRow(row),
      available_qty: Number(row.available_qty ?? 0),
      reserved_qty: Number(row.reserved_qty ?? 0),
      sellable_qty: Math.max(0, Number(row.available_qty ?? 0) - Number(row.reserved_qty ?? 0))
    }));
}

export function groupByCompany(products = []) {
  const map = new Map();
  for (const product of products) {
    const key = product.company_id || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        company_id: key,
        company_name: product.company_name || key,
        company_logo: product.company_logo || null,
        color: product.color || '#999',
        count: 0
      });
    }
    map.get(key).count += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.company_name.localeCompare(b.company_name, 'ar'));
}

export function buildProductIndex(products = []) {
  const map = new Map();
  for (const row of products) {
    const item = map.get(row.product_id) || {
      product_id: row.product_id,
      product_name: row.product_name,
      company_id: row.company_id,
      company_name: row.company_name,
      company_logo: row.company_logo || null,
      color: row.color || '#999',
      category: row.category,
      product_image: row.product_image || null,
      units: []
    };
    item.units.push({
      unit_code: row.unit_code,
      tier_name: row.tier_name,
      final_price: priceFromRuntimeRow(row),
      available_qty: Number(row.available_qty ?? 0),
      reserved_qty: Number(row.reserved_qty ?? 0),
      sellable_qty: Math.max(0, Number(row.available_qty ?? 0) - Number(row.reserved_qty ?? 0)),
      allow_backorder: Boolean(row.allow_backorder),
      runtime_healthy: row.runtime_healthy !== false
    });
    map.set(row.product_id, item);
  }
  return Array.from(map.values()).map((product) => ({
    ...product,
    units: product.units.sort((a, b) => (a.unit_code || '').localeCompare(b.unit_code || ''))
  }));
}

export function findProductVariant(products = [], productId, unitCode, tierName) {
  return products.find((row) => row.product_id === productId && row.unit_code === unitCode && row.tier_name === tierName) || null;
}
