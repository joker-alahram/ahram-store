import { ERROR_CODES, PricingError } from '../errors.js';
import { KIND } from '../types.js';
import { clampMoney, isActiveTier, normalizeTierName, toMoney } from '../validators.js';

export function selectTier(catalog, tierName) {
  const requested = normalizeTierName(tierName);
  const defaultTier = catalog?.defaultTier || null;
  const requestedTier = requested ? catalog?.tiersByName.get(requested) : null;

  if (requestedTier && isActiveTier(requestedTier)) {
    return { tier: requestedTier, fallbackUsed: false };
  }

  if (defaultTier && isActiveTier(defaultTier)) {
    return { tier: defaultTier, fallbackUsed: requested && requested !== defaultTier.tier_name };
  }

  if (requestedTier) {
    return { tier: requestedTier, fallbackUsed: false };
  }

  if (defaultTier) {
    return { tier: defaultTier, fallbackUsed: true };
  }

  throw new PricingError(ERROR_CODES.INVALID_TIER, 'No active tier available', {});
}

export function applyTierRule({ basePrice, catalog, tierName, product, unit, kind, context = {} }) {
  const { tier, fallbackUsed } = selectTier(catalog, tierName);
  const base = clampMoney(basePrice);
  const isProduct = kind === KIND.PRODUCT;
  const priceSource = context?.priceSource || {};

  if (!isProduct) {
    return {
      tier,
      fallbackUsed,
      tierAdjusted: base,
      discountPercent: 0,
    };
  }

  const percent = Number(tier?.discount_percent || 0);
  const allowedByProduct = unit === 'carton' ? product?.discount_carton !== false : product?.discount_pack !== false;
  const allowedByCompany = product?.allow_discount !== false && (product?.company_allow_discount !== false);

  const eligibleTotal = Number(context?.eligibleTotal ?? context?.cartEligibleTotal ?? 0);
  const meetsMinOrder = Number.isFinite(eligibleTotal) && Number.isFinite(Number(tier?.min_order))
    ? eligibleTotal >= Number(tier.min_order)
    : true;

  const matchedSelectedTier = String(priceSource?.sourceType || '') === 'tier-row'
    && String(priceSource?.matchedTier || '') === String(tier.tier_name || '');

  if (matchedSelectedTier) {
    return {
      tier,
      fallbackUsed,
      tierAdjusted: base,
      discountPercent: 0,
    };
  }

  if (!allowedByProduct || !allowedByCompany || !meetsMinOrder) {
    return {
      tier,
      fallbackUsed,
      tierAdjusted: base,
      discountPercent: 0,
    };
  }

  const adjusted = toMoney(base * (1 - Math.max(0, percent) / 100));
  return {
    tier,
    fallbackUsed,
    tierAdjusted: adjusted,
    discountPercent: percent,
  };
}
