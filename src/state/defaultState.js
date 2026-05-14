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
  const cachedCompanyRows = {};
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
      runtimeMode: 'browser',
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
    governance: {
      systemUser: null,
      capabilities: [],
      workflowTransitions: [],
      loaded: false,
      loading: false,
      failed: false,
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
      lifecycle: {
        phase: 'booting',
        locked: true,
        bootId: null,
        error: null,
        sessionRestored: false,
        authorityResolved: false,
        catalogReady: Boolean(cachedCatalog && (cachedCatalog.products?.length || cachedCatalog.companies?.length || cachedCatalog.tiers?.length)),
        offersReady: Boolean(cachedCatalog?.offers?.daily?.length || cachedCatalog?.offers?.flash?.length),
        flashOffersReady: Boolean(cachedCatalog?.offers?.flash?.length),
        companiesReady: Boolean(cachedCatalog?.companies?.length),
        pricingReady: Boolean(cachedCatalog?.products?.length),
        cartSynced: false,
        companyProductsReady: false,
        companyProductsLoading: false,
        companyProductsFailed: false,
      },
      loading: {
        catalog: false,
        company: null,
        customers: false,
        invoices: false,
        session: false,
        authority: false,
        pricing: false,
        governance: false,
      },
      companyRowsCache: cachedCompanyRows && typeof cachedCompanyRows === 'object' ? cachedCompanyRows : {},
      companyErrors: {},
      flashState: null,
      behavior: [],
      splashReady: false,
    },
  };
}
