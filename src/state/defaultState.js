import { loadJSON, storageKeys } from '../core/storage.js';

export function createInitialState() {
  return {
    app: {
      ready: false,
      route: { name: 'home', params: {} },
      lastError: null,
    },
    ui: {
      search: '',
      drawerOpen: false,
      activeModal: null,
      accountMenuOpen: false,
      selectedProductId: null,
      theme: loadJSON(storageKeys.theme, 'premium-dark') || 'premium-dark',
      toastQueue: [],
      flashTick: Date.now(),
      pendingFlow: null,
    },
    auth: {
      session: loadJSON(storageKeys.session, null),
      selectedCustomer: loadJSON(storageKeys.customer, null),
      loginBusy: false,
      registerBusy: false,
    },
    commerce: {
      selectedTier: loadJSON(storageKeys.tier, null),
      unitPrefs: loadJSON(storageKeys.unitPrefs, {}),
      qtyPrefs: loadJSON(storageKeys.qtyPrefs, {}),
      cart: loadJSON(storageKeys.cart, []),
      catalog: {
        companies: [],
        products: [],
        productIndex: {},
        offers: { daily: [], flash: [] },
        tiers: [],
        settings: [],
        settingsMap: {},
      },
      invoices: loadJSON(storageKeys.invoices, []),
      customers: [],
      top: { products: [], companies: [] },
      priceBook: { tierName: null, products: {} },
    },
    runtime: {
      loading: {
        catalog: false,
        customers: false,
        invoices: false,
      },
      flashState: null,
      invoiceSequence: Number(localStorage.getItem(storageKeys.invoiceSequence) || 20000),
      behavior: loadJSON(storageKeys.behavior, []),
    },
  };
}
