import { CONFIG } from '../config.js';
import { createDataLoader } from './data.loader.js';
import { createPricingResolver } from './resolver.js';
import { TTLCache } from './cache.js';

export function createPricingEngine(options = {}) {
  const loader = options.loader || createDataLoader({
    baseUrl: options.baseUrl || CONFIG.baseUrl,
    apiKey: options.apiKey || CONFIG.apiKey,
    fetchImpl: options.fetchImpl,
    storage: options.storage,
    cacheTtlMs: options.cacheTtlMs || CONFIG.cacheTtlMs,
    datasetTtlMs: options.datasetTtlMs || CONFIG.cacheTtlMs,
    datasetCacheKey: options.datasetCacheKey,
  });

  const resolver = createPricingResolver({
    loader,
    cache: options.cache || new TTLCache(options.priceCacheTtlMs || CONFIG.cacheTtlMs),
    currency: options.currency || 'EGP',
  });

  return {
    loader,
    ...resolver,
  };
}

export { createDataLoader } from './data.loader.js';
export { createPricingResolver } from './resolver.js';
export * from './errors.js';
export * from './types.js';
export * from './validators.js';
export * from './cache.js';
