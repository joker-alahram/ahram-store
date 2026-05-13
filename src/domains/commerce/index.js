export const COMMERCE_DOMAIN = 'commerce';
export { loadHomeCatalog, loadHomeSupplementary, loadTopSections, loadCompanyCatalog, aggregateRuntimeProducts, projectRuntimeProducts } from './services/catalogService.js';
export { buildPriceBook, persistSelectedTier, resolveProductUnit, syncCartPrices, normalizeTierName } from './services/pricingService.js';
export { addProductToCart, clearCart, computeTotals, hydrateCart, persistCart, recalcCart, removeItem, toggleOfferInCart, updateQty } from './services/cartService.js';
export { validateCheckout, submitOrder } from './services/orderService.js';
export { computeFlashState, isOfferActive } from './services/offerService.js';
export { buildWhatsAppInvoice, formatMoney, formatStatus, persistInvoices } from './services/invoiceService.js';
