import { createScopedStore } from './runtimeStore.js';

export function createCommerceStore(initialState) {
  return createScopedStore(initialState, 'commerce');
}
