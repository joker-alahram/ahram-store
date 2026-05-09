import { demoData } from '../services/demoData.js';
import { ROLES } from '../contracts/runtime.js';

export function createDefaultState(config = {}) {
  return {
    app: {
      ready: false,
      online: true,
      config
    },
    auth: {
      status: 'anonymous',
      user: null,
      role: ROLES.GUEST,
      session: null
    },
    ui: {
      route: 'home',
      search: '',
      selectedTier: 'base',
      selectedCompany: 'all',
      visibleCount: 12,
      theme: config.theme || 'dark',
      modal: null,
      drawer: null,
      toastSeq: 0
    },
    data: {
      settings: demoData.settings,
      tiers: demoData.tiers,
      companies: demoData.companies,
      products: demoData.products,
      dailyDeals: demoData.dailyDeals,
      flashOffers: demoData.flashOffers,
      authUsers: demoData.authUsers,
      customers: demoData.customers,
      orders: demoData.orders,
      uiEvents: demoData.uiEvents
    },
    cart: {
      items: [],
      customer_id: 'cust-1',
      payment_method: 'COD',
      note: '',
      updated_at: null
    },
    runtime: {
      lastSyncAt: null,
      source: 'local',
      diagnostics: {
        hasHydrationError: false,
        hasConsoleError: false
      }
    }
  };
}
