export function normalizeText(value) {
  return String(value ?? '').toLowerCase().trim();
}

export function safeJsonParse(raw, fallback = null) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function formatMoney(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return '0.00';
  return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

export function labelForUnit(unitCode) {
  const unit = String(unitCode ?? '').trim();
  return ({ carton: 'كرتونة', pack: 'دستة', half_pack: 'نصف دستة', piece: 'قطعة' }[unit] || unit || 'قطعة');
}

export function cartLineKey(item) {
  return [item.product_id, item.unit_code, item.tier_name].map((part) => String(part ?? '').trim()).join('::');
}

export function isoNow() {
  return new Date().toISOString();
}
