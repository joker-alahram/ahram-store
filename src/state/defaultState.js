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
      selectedInvoiceId: null,
      theme: 'premium-dark',
      toastQueue: [],
      flashTick: Date.now(),
      pendingFlow: null,
    },
    auth: {
      session: null,
      selectedCustomer: null,
      loginBusy: false,
      registerBusy: false,
    },
    commerce: {
      selectedTier: normalizeTierName(loadJSON(storageKeys.tier, null)),
      tierAcknowledged: false,
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
        invoicePreview: false,
        checkout: false,
        auth: false,
      },
      companyRowsCache: {},
      companyProjectionCache: {},
      companyErrors: {},
      flashState: null,
      invoicePreview: null,
      behavior: [],
    },
  };
}
