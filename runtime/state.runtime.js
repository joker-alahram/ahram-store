import { loadJSON } from './helpers.runtime.js';

export const CONFIG = Object.freeze({
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: localStorage.getItem('support_whatsapp') || '201040880002',
});

export const STORAGE = Object.freeze({
  session: 'b2b_session',
  cart: 'b2b_cart',
  tier: 'selected_tier',
  unitPrefs: 'b2b_unit_prefs',
  productQtyPrefs: 'b2b_product_qty_prefs',
  behavior: 'b2b_ui_behavior',
  dataCache: 'b2b_data_cache',
  selectedCustomer: 'b2b_selected_customer',
});

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const state = {
  view: { type: 'home' },
  search: '',
  companyFilter: null,
  pendingTierAction: null,
  pendingReturnHash: null,
  pendingOpenCart: false,
  activeProduct: null,
  activeDeal: null,
  session: readJSON(STORAGE.session, null),
  cart: readJSON(STORAGE.cart, []),
  selectedTier: readJSON(STORAGE.tier, null),
  unitPrefs: readJSON(STORAGE.unitPrefs, {}),
  productQtyPrefs: readJSON(STORAGE.productQtyPrefs, {}),
  behaviorEvents: readJSON(STORAGE.behavior, []),
  selectedCustomer: readJSON(STORAGE.selectedCustomer, null),
  companies: [],
  products: [],
  dailyDeals: [],
  flashOffers: [],
  tiers: [],
  settings: [],
  settingMap: new Map(),
  companyMap: new Map(),
  productMap: new Map(),
  tierPrices: {
    carton: new Map(),
    pack: new Map(),
  },
  topProducts: [],
  topCompanies: [],
  invoices: [],
  invoicesLoaded: false,
  customers: [],
  customersLoaded: false,
  checkoutStage: 'validate',
  uiEventWriteDisabled: false,
  timers: {
    flash: null,
  },
  flashState: { status: null, remaining: '', offer: null, endedAt: '' },
};

export const els = {
  headerSurface: document.getElementById('headerSurface'),
  mobileHeaderShell: document.getElementById('headerSurface'),
  menuBtn: document.getElementById('menuBtn'),
  navDrawer: document.getElementById('navDrawer'),
  bottomNav: document.getElementById('bottomNavSurface'),
  searchBar: document.getElementById('searchBar'),
  headerSearchInput: document.getElementById('headerSearchInput'),
  headerClearSearchBtn: document.getElementById('headerClearSearchBtn'),
  socialCall: document.getElementById('socialCall'),
  socialWhatsapp: document.getElementById('socialWhatsapp'),
  socialFacebook: document.getElementById('socialFacebook'),
  heroSurface: document.getElementById('heroSurface'),
  tierSurface: document.getElementById('tierSurface'),
  dailyDealSurface: document.getElementById('dailyDealSurface'),
  companiesSurface: document.getElementById('companiesSurface'),
  categoriesSurface: document.getElementById('categoriesSurface'),
  productsSurface: document.getElementById('productsSurface'),
  cartBtn: document.getElementById('cartBtn'),
  cartLabel: document.getElementById('cartLabel'),
  cartValue: document.getElementById('cartValue'),
  cartBadge: document.getElementById('cartBadge'),
  userBtn: document.getElementById('userBtn'),
  userBtnLabel: document.getElementById('userBtnLabel'),
  userBtnSub: document.getElementById('userBtnSub'),
  tierContextTitle: document.getElementById('tierContextTitle'),
  tierContextStatus: document.getElementById('tierContextStatus'),
  tierDiscountState: document.getElementById('tierDiscountState'),
  tierMinState: document.getElementById('tierMinState'),
  tierProgressFill: document.getElementById('tierProgressFill'),
  tierCurrentEligible: document.getElementById('tierCurrentEligible'),
  tierRemaining: document.getElementById('tierRemaining'),
  flashBtn: document.getElementById('flashBtn'),
  flashBtnText: document.getElementById('flashBtnText'),
  flashCountdownCapsule: document.getElementById('flashCountdownCapsule'),
  flashCountdownValue: document.getElementById('flashCountdownValue'),
  productModal: document.getElementById('productModal'),
  productModalBody: document.getElementById('productModalBody'),
  productModalTitle: document.getElementById('productModalTitle'),
  productModalAction: document.getElementById('productModalAction'),
  productModalSecondary: document.getElementById('productModalSecondary'),
  tierModal: document.getElementById('tierModal'),
  tierModalBody: document.getElementById('tierModalBody'),
  loginModal: document.getElementById('loginModal'),
  myDataModal: document.getElementById('myDataModal'),
  addCustomerModal: document.getElementById('addCustomerModal'),
  myDataContent: document.getElementById('myDataContent'),
  loginIdentifier: document.getElementById('loginIdentifier'),
  loginPassword: document.getElementById('loginPassword'),
  submitLogin: document.getElementById('submitLogin'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  saveCartBtn: document.getElementById('saveCartBtn'),
  toast: document.getElementById('toast'),
  custName: document.getElementById('custName'),
  custPhone: document.getElementById('custPhone'),
  custAddress: document.getElementById('custAddress'),
};
