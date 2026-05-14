import { createStore } from '../../state/store.js';

export function createRuntimeStore(initialState) {
  return createStore(initialState);
}

export function createScopedStore(initialState, namespace = 'runtime') {
  const store = createStore(initialState);
  return {
    ...store,
    namespace,
    patch(partial, meta = {}) {
      return store.patch(partial, { ...meta, namespace });
    },
    update(mutator, meta = {}) {
      return store.update(mutator, { ...meta, namespace });
    },
  };
}
