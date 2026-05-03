import { ERROR_CODES, PricingError } from '../errors.js';
import { UNIT, KIND } from '../types.js';
import { normalizeUnit } from '../validators.js';

export function applyUnitRule({ product, unit, kind }) {
  if (kind !== KIND.PRODUCT) {
    return {
      unit: normalizeUnit(unit || UNIT.PACK),
      fallbackUsed: false,
    };
  }

  const requested = normalizeUnit(unit || UNIT.PACK);
  const supportsPack = product?.has_pack !== false;
  const supportsCarton = product?.has_carton === true;

  if (requested === UNIT.CARTON && !supportsCarton) {
    if (supportsPack) {
      return { unit: UNIT.PACK, fallbackUsed: true };
    }
    throw new PricingError(ERROR_CODES.INVALID_UNIT, 'Product does not support carton pricing', { productId: product?.product_id });
  }

  if (requested === UNIT.PACK && !supportsPack) {
    if (supportsCarton) {
      return { unit: UNIT.CARTON, fallbackUsed: true };
    }
    throw new PricingError(ERROR_CODES.INVALID_UNIT, 'Product does not support pack pricing', { productId: product?.product_id });
  }

  return { unit: requested, fallbackUsed: false };
}
