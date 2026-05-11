import { loadJSON, storageKeys } from '../core/storage.js';
import { normalizeTierName } from '../services/pricingService.js';
import { normalizeSessionRecord } from '../services/authService.js';

function createEmptyCatalog() {
  return {
    companies: [],
    products: [],
    productIndex: {},
    offers: { daily: [], flash: [] },
    tiers: [],
    settings: [],
    settingsMap: {},
    top: { products: [], companies: [] },
    counters: { companies: 0, tiers: 0, deals: 0, flash: 0 },
    catalogProducts: [],
  };
}

export function createInitialState() {
  const cachedCatalog = loadJSON(storageKeys.catalog, null);
  const cachedCompanyRows = loadJSON(storageKeys.companyRowsCache, {});
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
      theme: loadJSON(storageKeys.theme, 'premium-dark') || 'premium-dark',
      toastQueue: [],
      flashTick: Date.now(),
      pendingFlow: null,
    },
    auth: {
      session: normalizeSessionRecord(loadJSON(storageKeys.session, null)),
      selectedCustomer: loadJSON(storageKeys.selectedCustomer, null),
      loginBusy: false,
      registerBusy: false,
      checkoutBusy: false,
    },
    commerce: {
      selectedTier: normalizeTierName(loadJSON(storageKeys.tier, null)),
      unitPrefs: {},
      qtyPrefs: {},
      cart: loadJSON(storageKeys.cart, []),
      catalog: cachedCatalog && typeof cachedCatalog === 'object' ? { ...createEmptyCatalog(), ...cachedCatalog } : createEmptyCatalog(),
      invoices: [],
      invoiceItemsById: {},
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
      companyRowsCache: cachedCompanyRows && typeof cachedCompanyRows === 'object' ? cachedCompanyRows : {},
      companyErrors: {},
      flashState: null,
      behavior: [],
    },
  };
}
