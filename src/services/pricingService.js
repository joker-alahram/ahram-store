export function formatMoney(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(number);
}

export function priceFromRuntimeRow(row) {
  return Number(row?.final_price ?? 0);
}

export function buildPricingSnapshot(row) {
  return {
    product_id: row.product_id,
    product_name: row.product_name,
    unit_code: row.unit_code,
    tier_name: row.tier_name,
    final_price: priceFromRuntimeRow(row),
    available_qty: Number(row.available_qty ?? 0),
    reserved_qty: Number(row.reserved_qty ?? 0),
    allow_backorder: Boolean(row.allow_backorder)
  };
}

export function labelForUnit(unitCode) {
  const map = {
    carton: 'كرتونة',
    pack: 'دسته',
    unit: 'قطعة',
    piece: 'قطعة',
    half_pack: 'نصف'
  };
  return map[unitCode] || unitCode || 'وحدة';
}
