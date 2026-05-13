import { normalizeTierName } from '../../../services/pricingService.js';

function sanitizeImageSrc(value) {
  const src = String(value ?? '').trim();
  return src || '';
}

function normalizeSpacing(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeCompany(row = {}) {
  return {
    company_id: normalizeSpacing(row.company_id ?? row.id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    visible: row.visible !== false,
    allow_discount: row.allow_discount !== false,
  };
}

export function normalizeTier(row = {}) {
  const canonical = normalizeTierName(row.tier_name);
  return {
    tier_name: canonical,
    visible_label: normalizeSpacing(row.visible_label ?? row.tier_name ?? ''),
    min_order: Number(row.min_order ?? 0),
    discount_percent: Number(row.discount_percent ?? 0),
    visible: row.visible !== false,
    is_active: row.is_active !== false,
    is_default: row.is_default === true,
    discount_carton: row.discount_carton !== false,
    discount_pack: row.discount_pack !== false,
  };
}

export function normalizeOffer(row = {}, kind = 'daily') {
  return {
    ...row,
    kind,
    id: row.id,
    title: normalizeSpacing(row.title ?? ''),
    description: normalizeSpacing(row.description ?? ''),
    image: sanitizeImageSrc(row.image || ''),
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    can_buy: row.can_buy !== false && row.is_active !== false && (kind === 'daily' ? Number(row.stock ?? 0) > 0 : true),
    status: row.status || (kind === 'flash' ? 'scheduled' : 'active'),
  };
}

export function normalizeRuntimeRow(row = {}) {
  return {
    product_id: normalizeSpacing(row.product_id ?? ''),
    product_name: normalizeSpacing(row.product_name ?? ''),
    company_id: normalizeSpacing(row.company_id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    category: normalizeSpacing(row.category ?? ''),
    product_image: sanitizeImageSrc(row.product_image || ''),
    status: normalizeSpacing(row.status ?? '') || 'active',
    visible: row.visible !== false,
    unit_code: normalizeSpacing(row.unit_code ?? ''),
    tier_name: normalizeTierName(row.tier_name),
    final_price: Number(row.final_price ?? 0),
    available_qty: Number(row.available_qty ?? 0),
    reserved_qty: Number(row.reserved_qty ?? 0),
    allow_backorder: row.allow_backorder === true,
    runtime_healthy: row.runtime_healthy !== false,
    is_sellable: row.is_sellable !== false,
    unit_active: row.unit_active !== false,
    min_qty: Number(row.min_qty ?? 1),
    display_order: Number(row.display_order ?? 0),
  };
}

export function normalizeCatalogRow(row = {}) {
  return {
    product_id: normalizeSpacing(row.product_id ?? ''),
    product_name: normalizeSpacing(row.product_name ?? ''),
    company_id: normalizeSpacing(row.company_id ?? ''),
    company_name: normalizeSpacing(row.company_name ?? ''),
    company_logo: sanitizeImageSrc(row.company_logo || ''),
    category: normalizeSpacing(row.category ?? ''),
    product_image: sanitizeImageSrc(row.product_image || ''),
    status: normalizeSpacing(row.status ?? '') || 'active',
    visible: row.visible !== false,
    unit_code: normalizeSpacing(row.unit_code ?? ''),
    tier_name: normalizeTierName(row.tier_name),
    final_price: Number(row.final_price ?? 0),
    available_qty: Number(row.available_qty ?? 0),
    reserved_qty: Number(row.reserved_qty ?? 0),
    allow_backorder: row.allow_backorder === true,
    runtime_healthy: row.can_buy !== false,
    is_sellable: row.can_buy !== false,
    unit_active: row.unit_active !== false,
    min_qty: Number(row.min_qty ?? 1),
    display_order: Number(row.display_order ?? 0),
    can_buy: row.can_buy !== false,
    availability_reason: row.availability_reason || null,
  };
}
