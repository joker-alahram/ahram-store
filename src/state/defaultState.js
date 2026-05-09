import { loadJSON, storageKeys } from '../core/storage.js';
import { normalizeTierName } from '../services/pricingService.js';

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
      theme: 'premium-dark',
      toastQueue: [],
      flashTick: Date.now(),
      pendingFlow: null,
    },
    auth: {
      session: loadJSON(storageKeys.session, null),
      selectedCustomer: null,
      loginBusy: false,
      registerBusy: false,
    },
    commerce: {
      selectedTier: normalizeTierName(loadJSON(storageKeys.tier, null)),
      unitPrefs: {},
      qtyPrefs: {},
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
      invoices: [],
      customers: [],
      top: { products: [], companies: [] },
      priceBook: { tierName: null, products: {} },
    },
    runtime: {
      loading: {
        catalog: false,
        company: null,
        customers: false,
        invoices: false,
      },
      companyRowsCache: {},
      companyErrors: {},
      flashState: null,
      behavior: [],
    },
  };
}
