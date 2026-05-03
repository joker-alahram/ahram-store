import { ERROR_CODES, PricingError } from './errors.js';
import { DEFAULT_CURRENCY, KIND, SOURCE } from './types.js';
import {
  assertCatalog,
  clampMoney,
  isActiveTier,
  isVisibleEntity,
  normalizeKind,
  normalizeNow,
  normalizeProductId,
  normalizeQty,
  normalizeTierName,
  normalizeUnit,
} from './validators.js';
import { applyUnitRule } from './rules/unit.rule.js';
import { applyTierRule } from './rules/tier.rule.js';
import { applyDealsRule } from './rules/deals.rule.js';
import { applyFlashRule } from './rules/flash.rule.js';
import { makePriceCacheKey, TTLCache } from './cache.js';

function pickProduct(loader, productId, kind) {
  if (kind === KIND.DEAL) {
    return loader.getDeal(productId);
  }
  if (kind === KIND.FLASH) {
    return loader.getFlash(productId);
  }
  return loader.getProduct(productId);
}

function assertProductAllowed(product, productId, kind) {
  if (!product) {
    throw new PricingError(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', { productId, kind });
  }
  if (kind === KIND.PRODUCT && !isVisibleEntity(product)) {
    throw new PricingError(ERROR_CODES.PRODUCT_INACTIVE, 'Product is inactive or hidden', { productId });
  }
}


function getBasePrice(loader, productId, tierName, unit, kind) {
  if (kind === KIND.DEAL || kind === KIND.FLASH) {
    const item = pickProduct(loader, productId, kind);
    const raw = Number(item?.price);
    if (!Number.isFinite(raw)) {
      throw new PricingError(ERROR_CODES.PRICE_NOT_FOUND, 'Offer price is missing', { productId, kind });
    }
    return {
      price: clampMoney(raw),
      sourceType: 'offer',
      sourceTier: null,
      matchedTier: null,
    };
  }

  const requestedRow = loader.getPriceRow(productId, tierName, unit);
  if (requestedRow && requestedRow.visible !== false && Number.isFinite(Number(requestedRow.price))) {
    return {
      price: clampMoney(requestedRow.price),
      sourceType: 'tier-row',
      sourceTier: String(tierName || ''),
      matchedTier: String(tierName || ''),
    };
  }

  const fallbackView = loader.getFallbackViewPrice(productId, unit);
  if (fallbackView && Number.isFinite(Number(fallbackView.price))) {
    return {
      price: clampMoney(fallbackView.price),
      sourceType: 'fallback-view',
      sourceTier: String(fallbackView.tier_name || ''),
      matchedTier: String(fallbackView.tier_name || ''),
    };
  }

  if (tierName) {
    const defaultTier = loader.getDefaultTier();
    if (defaultTier && String(defaultTier.tier_name) !== String(tierName)) {
      const fallbackRow = loader.getPriceRow(productId, defaultTier.tier_name, unit);
      if (fallbackRow && fallbackRow.visible !== false && Number.isFinite(Number(fallbackRow.price))) {
        return {
          price: clampMoney(fallbackRow.price),
          sourceType: 'default-tier-row',
          sourceTier: String(defaultTier.tier_name || ''),
          matchedTier: String(defaultTier.tier_name || ''),
        };
      }
    }
  }

  throw new PricingError(ERROR_CODES.PRICE_NOT_FOUND, 'Base price is missing', { productId, tierName, unit });
}

function normalizeContext(context = {}) {
  return {
    now: normalizeNow(context.now),
    deals: Array.isArray(context.deals) ? context.deals : [],
    flash: Array.isArray(context.flash) ? context.flash : [],
    eligibleTotal: context.eligibleTotal,
    cartEligibleTotal: context.cartEligibleTotal,
    kind: normalizeKind(context.kind),
  };
}

export function createPricingResolver({ loader, cache = new TTLCache(300000), currency = DEFAULT_CURRENCY } = {}) {
  if (!loader) {
    throw new Error('createPricingResolver requires a loader');
  }

  async function resolvePrice(input = {}) {
    const productId = normalizeProductId(input.productId);
    const qty = normalizeQty(input.qty);
    const tierName = normalizeTierName(input.tierName);
    const kind = normalizeKind(input.kind || input.type || input.context?.kind);
    const context = normalizeContext(input.context || {});
    const requestedUnit = normalizeUnit(input.unit || 'pack');

    await loader.ensureCatalog();
    assertCatalog(loader.getCatalog());

    const cacheKeyBase = makePriceCacheKey({ productId, tierName: tierName || '', unit: requestedUnit, kind });
    const cacheKey = kind === KIND.FLASH ? `${cacheKeyBase}|${Math.floor(Number(context.now) / 60000)}` : cacheKeyBase;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const product = pickProduct(loader, productId, kind);
    assertProductAllowed(product, productId, kind);
    const enrichedProduct = kind === KIND.PRODUCT
      ? { ...product, company_allow_discount: loader.getCompany(product?.company_id)?.allow_discount }
      : product;

    const unitRule = applyUnitRule({ product: enrichedProduct, unit: requestedUnit, kind });
    const unit = unitRule.unit;

    const baseInfo = getBasePrice(loader, productId, tierName || loader.getDefaultTier()?.tier_name || '', unit, kind);
    const base = baseInfo.price;

    const tierResult = applyTierRule({
      basePrice: base,
      catalog: loader.getCatalog(),
      tierName,
      product: enrichedProduct,
      unit,
      kind,
      context: { ...context, priceSource: baseInfo },
    });

    const dealResult = applyDealsRule({
      basePrice: tierResult.tierAdjusted,
      productId,
      kind,
      context,
      loader,
      now: context.now,
    });

    const flashResult = applyFlashRule({
      basePrice: dealResult.price,
      productId,
      kind,
      context,
      loader,
      now: context.now,
    });

    const final = clampMoney(flashResult.price);

    const result = Object.freeze({
      unitPrice: final,
      total: clampMoney(final * qty),
      currency,
      breakdown: Object.freeze({
        base: clampMoney(base),
        tierAdjusted: clampMoney(tierResult.tierAdjusted),
        dealAdjusted: clampMoney(dealResult.price),
        flashAdjusted: clampMoney(flashResult.price),
        final,
      }),
      meta: Object.freeze({
        appliedTier: tierResult.tier?.tier_name || null,
        appliedOffer: flashResult.applied?.id || dealResult.applied?.id || null,
        unit,
        source: SOURCE,
        timestamp: new Date(context.now).toISOString(),
        kind,
        fallbackUnitUsed: Boolean(unitRule.fallbackUsed),
        tierFallbackUsed: Boolean(tierResult.fallbackUsed),
      }),
    });

    cache.set(cacheKey, result);
    return result;
  }

  function invalidateCache(key) {
    if (!key) {
      cache.clear();
      return;
    }
    cache.delete(key);
  }

  function clearCache() {
    cache.clear();
  }

  async function preload() {
    await loader.ensureCatalog();
    return true;
  }

  return {
    resolvePrice,
    invalidateCache,
    clearCache,
    preload,
    cache,
  };
}
