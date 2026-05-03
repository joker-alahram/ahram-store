import assert from 'node:assert/strict';
import { createPricingEngine } from './index.js';
import { createCartEngine } from '../cart.engine.js';
import { KIND } from './types.js';
import { PricingError, ERROR_CODES } from './errors.js';

function makeLoader() {
  const catalog = {
    loadedAt: Date.now(),
    products: [
      { product_id: 'p1', product_name: 'Product 1', visible: true, status: 'active', has_pack: true, has_carton: true, discount_pack: true, discount_carton: true },
      { product_id: 'p2', product_name: 'Product 2', visible: true, status: 'active', has_pack: true, has_carton: false, discount_pack: true, discount_carton: true },
    ],
    productsById: new Map([
      ['p1', { product_id: 'p1', product_name: 'Product 1', visible: true, status: 'active', has_pack: true, has_carton: true, discount_pack: true, discount_carton: true }],
      ['p2', { product_id: 'p2', product_name: 'Product 2', visible: true, status: 'active', has_pack: true, has_carton: false, discount_pack: true, discount_carton: true }],
    ]),
    productsViewById: new Map([
      ['p1', { product_id: 'p1', pack_price: 100, carton_price: 90 }],
      ['p2', { product_id: 'p2', pack_price: 55, carton_price: null }],
    ]),
    deals: [
      { id: 'd1', title: 'Deal 1', price: 70, is_active: true, visible: true, stock: 5, can_buy: true },
    ],
    dealsById: new Map([
      ['d1', { id: 'd1', title: 'Deal 1', price: 70, is_active: true, visible: true, stock: 5, can_buy: true }],
    ]),
    flashOffers: [
      { id: 'f1', title: 'Flash 1', price: 60, is_active: true, visible: true, stock: 5, can_buy: true, start_time: '2026-01-01T00:00:00Z', end_time: '2026-12-31T23:59:59Z' },
    ],
    flashById: new Map([
      ['f1', { id: 'f1', title: 'Flash 1', price: 60, is_active: true, visible: true, stock: 5, can_buy: true, start_time: '2026-01-01T00:00:00Z', end_time: '2026-12-31T23:59:59Z' }],
    ]),
    tiers: [
      { tier_name: 'base', visible: true, is_active: true, is_default: true, discount_percent: 0, min_order: 0, discount_pack: true, discount_carton: true },
      { tier_name: 'vip', visible: true, is_active: true, is_default: false, discount_percent: 10, min_order: 0, discount_pack: true, discount_carton: true },
    ],
    tiersByName: new Map([
      ['base', { tier_name: 'base', visible: true, is_active: true, is_default: true, discount_percent: 0, min_order: 0, discount_pack: true, discount_carton: true }],
      ['vip', { tier_name: 'vip', visible: true, is_active: true, is_default: false, discount_percent: 10, min_order: 0, discount_pack: true, discount_carton: true }],
    ]),
    defaultTier: { tier_name: 'base', visible: true, is_active: true, is_default: true, discount_percent: 0, min_order: 0, discount_pack: true, discount_carton: true },
    companies: [],
    companiesById: new Map(),
    cartonPriceByKey: new Map([
      ['p1|base|carton', { product_id: 'p1', tier_name: 'base', price: 90, visible: true }],
      ['p1|vip|carton', { product_id: 'p1', tier_name: 'vip', price: 80, visible: true }],
    ]),
    packPriceByKey: new Map([
      ['p1|base|pack', { product_id: 'p1', tier_name: 'base', price: 100, visible: true }],
      ['p1|vip|pack', { product_id: 'p1', tier_name: 'vip', price: 90, visible: true }],
    ]),
    pricesCarton: [],
    pricesPack: [],
    customers: [],
    customersById: new Map(),
    customersByUsername: new Map(),
    customersByPhone: new Map(),
  };

  return {
    ensureCatalog: async () => catalog,
    getCatalog: () => catalog,
    getProduct: (id) => catalog.productsById.get(String(id)) || null,
    getViewProduct: (id) => catalog.productsViewById.get(String(id)) || null,
    getTier: (name) => catalog.tiersByName.get(String(name)) || null,
    getDefaultTier: () => catalog.defaultTier,
    getCompany: () => null,
    getPriceRow: (id, tier, unit) => {
      const key = [String(id), String(tier), String(unit)].join('|');
      return unit === 'carton' ? catalog.cartonPriceByKey.get(key) || null : catalog.packPriceByKey.get(key) || null;
    },
    getFallbackViewPrice: (id, unit) => {
      const v = catalog.productsViewById.get(String(id));
      return v ? { product_id: id, tier_name: 'base', price: unit === 'carton' ? v.carton_price : v.pack_price, visible: true } : null;
    },
    getDeal: (id) => catalog.dealsById.get(String(id)) || null,
    getFlash: (id) => catalog.flashById.get(String(id)) || null,
    getCustomer: () => null,
  };
}

async function run() {
  const loader = makeLoader();
  const engine = createPricingEngine({ loader, priceCacheTtlMs: 1000 });
  const cartEngine = createCartEngine({ resolvePrice: engine.resolvePrice });

  const packBase = await engine.resolvePrice({ productId: 'p1', qty: 2, unit: 'pack', tierName: 'base' });
  const vipPack = await engine.resolvePrice({ productId: 'p1', qty: 2, unit: 'pack', tierName: 'vip' });
  assert.equal(packBase.unitPrice, 100);
  assert.equal(vipPack.unitPrice, 90);
  assert.equal(packBase.total, 200);
  assert.equal(vipPack.total, 180);

  const carton = await engine.resolvePrice({ productId: 'p1', qty: 1, unit: 'carton', tierName: 'vip' });
  assert.equal(carton.unitPrice, 80);

  const fallback = await engine.resolvePrice({ productId: 'p2', qty: 1, unit: 'pack', tierName: 'vip' });
  assert.equal(fallback.unitPrice, 49.5);

  const deal = await engine.resolvePrice({ productId: 'd1', qty: 1, unit: 'pack', tierName: 'base', kind: KIND.DEAL });
  assert.equal(deal.unitPrice, 70);

  const flash = await engine.resolvePrice({ productId: 'f1', qty: 1, unit: 'pack', tierName: 'base', kind: KIND.FLASH, context: { now: '2026-06-01T00:00:00Z' } });
  assert.equal(flash.unitPrice, 60);

  await assert.rejects(
    () => engine.resolvePrice({ productId: 'f1', qty: 1, unit: 'pack', tierName: 'base', kind: KIND.FLASH, context: { now: '2030-01-01T00:00:00Z' } }),
    (error) => error instanceof PricingError && error.code === ERROR_CODES.FLASH_EXPIRED
  );

  await assert.rejects(
    () => engine.resolvePrice({ productId: 'p1', qty: 0, unit: 'pack', tierName: 'base' }),
    (error) => error instanceof PricingError && error.code === ERROR_CODES.INVALID_INPUT
  );

  await assert.rejects(
    () => engine.resolvePrice({ productId: 'missing', qty: 1, unit: 'pack', tierName: 'base' }),
    (error) => error instanceof PricingError && error.code === ERROR_CODES.PRODUCT_NOT_FOUND
  );

  const cart = [];
  const cart1 = await cartEngine.addToCart(cart, { productId: 'p1', qty: 1, unit: 'pack', tierName: 'vip', price: 999 });
  assert.equal(cart1[0].price, 90);
  const repriced = await cartEngine.repriceCart(cart1);
  assert.equal(repriced[0].price, 90);

  console.log('pricing-engine tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
