import { ERROR_CODES, PricingError } from '../errors.js';
import { KIND } from '../types.js';
import { clampMoney, normalizeArray, isVisibleEntity } from '../validators.js';

function findDealMatch({ productId, kind, context = {}, loader }) {
  const directContextDeals = normalizeArray(context.deals);
  const candidates = [
    ...directContextDeals,
    loader?.getDeal(productId),
  ].filter(Boolean);

  if (kind === KIND.DEAL) {
    return candidates.find((item) => String(item.id) === String(productId)) || null;
  }

  return candidates.find((item) => {
    const ids = [item.product_id, item.productId, item.id, item.deal_id, item.dealId].map((v) => String(v ?? ''));
    return ids.includes(String(productId));
  }) || null;
}

export function applyDealsRule({ basePrice, productId, kind, context = {}, loader, now }) {
  const match = findDealMatch({ productId, kind, context, loader });
  const base = clampMoney(basePrice);
  if (!match) {
    return { price: base, applied: null, override: false };
  }

  if (!isVisibleEntity(match)) {
    return { price: base, applied: null, override: false };
  }

  if (match.is_active === false || match.can_buy === false) {
    return { price: base, applied: null, override: false };
  }

  const stock = Number(match.stock ?? match.remaining_stock ?? 0);
  if (Number.isFinite(stock) && stock <= 0) {
    throw new PricingError(ERROR_CODES.OUT_OF_STOCK, 'Deal is out of stock', { productId });
  }

  const price = clampMoney(match.price ?? base);
  return {
    price,
    applied: match,
    override: price !== base,
  };
}
