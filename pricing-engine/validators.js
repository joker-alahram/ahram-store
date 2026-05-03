import { ERROR_CODES, PricingError } from './errors.js';
import { KIND, UNIT } from './types.js';

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeString(value) {
  return String(value ?? '').trim();
}

export function normalizeProductId(value) {
  const out = normalizeString(value);
  if (!out) {
    throw new PricingError(ERROR_CODES.INVALID_INPUT, 'productId is required', { field: 'productId' });
  }
  return out;
}

export function normalizeQty(value) {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new PricingError(ERROR_CODES.INVALID_INPUT, 'qty must be a positive finite number', { field: 'qty' });
  }
  return qty;
}

export function normalizeUnit(value) {
  const unit = normalizeString(value).toLowerCase();
  if (unit === UNIT.CARTON || unit === UNIT.PACK) return unit;
  if (!unit) return UNIT.PACK;
  throw new PricingError(ERROR_CODES.INVALID_UNIT, `Invalid unit "${value}"`, { value });
}

export function normalizeKind(value) {
  const kind = normalizeString(value).toLowerCase();
  if (!kind) return KIND.PRODUCT;
  if (kind === KIND.PRODUCT || kind === KIND.DEAL || kind === KIND.FLASH) return kind;
  return KIND.PRODUCT;
}

export function normalizeTierName(value) {
  const tier = normalizeString(value);
  return tier || null;
}

export function normalizeNow(value) {
  if (value === undefined || value === null || value === '') return Date.now();
  const ts = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(ts)) {
    throw new PricingError(ERROR_CODES.INVALID_INPUT, 'context.now must be a valid timestamp', { field: 'context.now' });
  }
  return ts;
}

export function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new PricingError(ERROR_CODES.INVALID_INPUT, 'Price is not finite', { value });
  }
  return Math.round(n * 100) / 100;
}

export function clampMoney(value) {
  const n = toMoney(value);
  if (n < 0) {
    throw new PricingError(ERROR_CODES.INVALID_INPUT, 'Price cannot be negative', { value: n });
  }
  return n;
}

export function isVisibleEntity(entity) {
  if (!entity) return false;
  if (entity.visible === false) return false;
  if (entity.status && String(entity.status).toLowerCase() !== 'active') return false;
  return true;
}

export function isActiveTier(tier) {
  if (!tier) return false;
  return tier.visible !== false && tier.is_active !== false;
}

export function isWithinWindow(now, startTime, endTime) {
  const nowMs = Number(now);
  if (!Number.isFinite(nowMs)) return false;
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return nowMs >= start && nowMs <= end;
}

export function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function assertCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object') {
    throw new PricingError(ERROR_CODES.NO_CATALOG, 'Pricing catalog is not loaded', {});
  }
}
