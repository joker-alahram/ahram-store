import { createScopedStore } from './runtimeStore.js';

export function createAuthStore(initialState) {
  return createScopedStore(initialState, 'auth');
}
