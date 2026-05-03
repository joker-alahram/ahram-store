export class PricingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PricingError';
    this.code = code;
    this.details = details;
  }
}

export const ERROR_CODES = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',
  INVALID_UNIT: 'INVALID_UNIT',
  INVALID_TIER: 'INVALID_TIER',
  PRICE_NOT_FOUND: 'PRICE_NOT_FOUND',
  FLASH_EXPIRED: 'FLASH_EXPIRED',
  DEAL_NOT_ACTIVE: 'DEAL_NOT_ACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  NO_CATALOG: 'NO_CATALOG',
});
