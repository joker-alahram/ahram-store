import { ERROR_CODES, PricingError } from '../errors.js';
import { KIND } from '../types.js';
import { clampMoney, isWithinWindow, normalizeArray, isVisibleEntity } from '../validators.js';

function findFlashMatch({ productId, kind, context = {}, loader }) {
  const directContextFlash = normalizeArray(context.flash);
  const candidates = [
    ...directContextFlash,
    loader?.getFlash(productId),
  ].filter(Boolean);

  if (kind === KIND.FLASH) {
    return candidates.find((item) => String(item.id) === String(productId)) || null;
  }

  return candidates.find((item) => {
    const ids = [item.product_id, item.productId, item.id, item.flash_id, item.flashId].map((v) => String(v ?? ''));
    return ids.includes(String(productId));
  }) || null;
}

export function applyFlashRule({ basePrice, productId, kind, context = {}, loader, now }) {
  const match = findFlashMatch({ productId, kind, context, loader });
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
    throw new PricingError(ERROR_CODES.OUT_OF_STOCK, 'Flash offer is out of stock', { productId });
  }

  const inWindow = isWithinWindow(now, match.start_time, match.end_time);
  if (!inWindow && kind === KIND.FLASH) {
    throw new PricingError(ERROR_CODES.FLASH_EXPIRED, 'Flash offer has expired', { productId });
  }

  if (!inWindow) {
    return { price: base, applied: null, override: false };
  }

  const price = clampMoney(match.price ?? base);
  return {
    price,
    applied: match,
    override: price !== base,
  };
}
