import { storageGet, storageSet } from '../core/storage.js';
import { createDefaultState } from './defaultState.js';

const STORAGE_KEY = 'ahram-b2b-runtime:v1';

function mergeState(base, patch) {
  return {
    ...base,
    ...patch,
    app: { ...base.app, ...(patch.app || {}) },
    auth: { ...base.auth, ...(patch.auth || {}) },
    ui: { ...base.ui, ...(patch.ui || {}) },
    data: { ...base.data, ...(patch.data || {}) },
    cart: { ...base.cart, ...(patch.cart || {}) },
    runtime: { ...base.runtime, ...(patch.runtime || {}) }
  };
}

export function createStore(config = {}) {
  const base = createDefaultState(config);
  const persisted = storageGet(STORAGE_KEY, null);
  let state = persisted ? mergeState(base, persisted) : base;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater, meta = {}) {
    const next = typeof updater === 'function' ? updater(state) : updater;
    state = mergeState(state, next || {});
    storageSet(STORAGE_KEY, {
      auth: state.auth,
      ui: { ...state.ui, modal: null, drawer: null, visibleCount: state.ui.visibleCount },
      cart: state.cart,
      data: {
        customers: state.data.customers,
        orders: state.data.orders,
        uiEvents: state.data.uiEvents.slice(-200)
      },
      runtime: state.runtime
    });
    listeners.forEach((listener) => listener(state, meta));
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
