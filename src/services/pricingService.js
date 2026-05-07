const UNIT_LABELS = {
  carton: 'كرتونة',
  pack: 'دستة',
  half_pack: 'نصف دستة',
  piece: 'قطعة',
  single: 'قطعة',
};

const UNIT_FIELDS = {
  carton: 'carton_price',
  pack: 'pack_price',
  half_pack: 'half_pack_price',
  piece: 'piece_price',
};

const ACCEPTED_UNITS = new Set(Object.keys(UNIT_LABELS));

export function labelForUnit(unit) {
  return UNIT_LABELS[String(unit || '').trim()] || String(unit || '').trim() || 'قطعة';
}

export function sanitizeImageUrl(value) {
  const src = String(value || '').trim();
  if (!src) return '';
  if (/^data:image\//i.test(src)) return '';
  return src;
}

export function resolveProductUnit(product, preferredUnit = null) {
  const available = Array.isArray(product?.sellable_units)
    ? product.sellable_units.map((unit) => String(unit || '').trim()).filter((unit) => ACCEPTED_UNITS.has(unit))
    : [];
  const requested = String(preferredUnit || '').trim();
  if (requested && available.includes(requested)) return requested;
  return available[0] || null;
}

export function getUnitPrice(product, unit) {
  const unitCode = String(unit || '').trim();
  if (!unitCode) return null;
  const field = UNIT_FIELDS[unitCode];
  if (!field) return null;
  const value = Number(product?.[field] ?? product?.prices?.[unitCode] ?? NaN);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Number(value.toFixed(2));
}

export function persistSelectedTier(tierName) {
  localStorage.setItem('alahram_v1:tier', JSON.stringify(tierName || null));
}
