export * from './catalogLoader.js';
export * from './catalogProjection.js';
export * from './catalogNormalizer.js';
export * from './pricingProjection.js';
export * from './offerProjection.js';

export function createCatalogRuntime() {
  return {
    domain: 'commerce',
    bounded: true,
  };
}
