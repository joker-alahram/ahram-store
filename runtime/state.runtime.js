import { loadJSON } from './helpers.runtime.js';
/* state.runtime.js — shared runtime state and centralized DOM ownership */
var CONFIG = window.CONFIG || (window.CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: localStorage.getItem('support_whatsapp') || '201040880002',
});

const STORAGE = {
  session: 'b2b_session',
  cart: 'b2b_cart',
  tier: 'selected_tier',
  unitPrefs: 'b2b_unit_prefs',
  productQtyPrefs: 'b2b_product_qty_prefs',
  behavior: 'b2b_ui_behavior',
  dataCache: 'b2b_data_cache',
};

export const state = {
  view: { type: 'home' },
  session: loadJSON(STORAGE.session, null),
  cart: loadJSON(STORAGE.cart, []),
  selectedTier: loadJSON(STORAGE.tier, null),
  unitPrefs: loadJSON(STORAGE.unitPrefs, {}),
  productQtyPrefs: loadJSON(STORAGE.productQtyPrefs, {}),
  companies: [],
  products: [],
  dailyDeals: [],
  flashOffers: [],
  tiers: [],
  settings: [],
  settingMap: new Map(),
  companyMap: new Map(),
  tierPrices: {
    carton: new Map(),
    pack: new Map(),
  },
  search: '',
  invoices: [],
  invoicesLoaded: false,
  customers: [],
  customersLoaded: false,
  selectedCustomer: loadJSON('b2b_selected_customer', null),
  checkoutStage: 'validate',
  pendingReturnHash: null,
  pendingOpenCart: false,
  pendingScrollTarget: null,
  behaviorEvents: loadJSON(STORAGE.behavior, []),
  topProducts: [],
  topCompanies: [],
  activeProduct: null,
  activeDeal: null,
  pendingTierAction: null,
  behavior: {
    visitedDeals: false,
    visitedFlash: false,
    lastCartActivity: Date.now(),
    lastTierPrompt: 0,
    lastDealsPrompt: 0,
    lastFlashPrompt: 0,
    lastCartPrompt: 0,
  },
};

const cachedDataset = loadJSON(STORAGE.dataCache, null);
if (cachedDataset) {
  state.companies = Array.isArray(cachedDataset.companies) ? cachedDataset.companies : [];
  state.products = Array.isArray(cachedDataset.products) ? cachedDataset.products : [];
  state.dailyDeals = Array.isArray(cachedDataset.dailyDeals) ? cachedDataset.dailyDeals : [];
  state.flashOffers = Array.isArray(cachedDataset.flashOffers) ? cachedDataset.flashOffers : [];
  state.tiers = Array.isArray(cachedDataset.tiers) ? cachedDataset.tiers : [];
  state.settings = Array.isArray(cachedDataset.settings) ? cachedDataset.settings : [];
  state.topProducts = Array.isArray(cachedDataset.topProducts) ? cachedDataset.topProducts : [];
  state.topCompanies = Array.isArray(cachedDataset.topCompanies) ? cachedDataset.topCompanies : [];
}

const CART_ENGINE = window.CART_ENGINE;

const els = {
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
  banner: document.getElementById('heroSurface'),
  tierSurface: document.getElementById('tierSurface'),
  dailyDealSurface: document.getElementById('dailyDealSurface'),
  companiesSurface: document.getElementById('companiesSurface'),
  categoriesSurface: document.getElementById('categoriesSurface'),
  productsSurface: document.getElementById('productsSurface'),
  pageContent: document.getElementById('productsSurface'),
  registerPage: document.getElementById('productsSurface'),
  userBtnLabel: document.getElementById('userBtnLabel'),
  userBtnSub: document.getElementById('userBtnSub'),
  cartBadge: document.getElementById('cartBadge'),
  tierDiscountState: document.getElementById('tierDiscountState'),
  tierMinState: document.getElementById('tierMinState'),
  tierProgressFill: document.getElementById('tierProgressFill'),
  tierCurrentEligible: document.getElementById('tierCurrentEligible'),
  tierRemaining: document.getElementById('tierRemaining'),
  productModal: document.getElementById('productModal'),
  productModalBody: document.getElementById('productModalBody'),
  productModalTitle: document.getElementById('productModalTitle'),
  productModalAction: document.getElementById('productModalAction'),
  productModalSecondary: document.getElementById('productModalSecondary'),
  tierBtn: document.getElementById('tierBtn'),
  tierContextTitle: document.getElementById('tierContextTitle'),
  tierContextStatus: document.getElementById('tierContextStatus'),
  tierModal: document.getElementById('tierModal'),
  tierModalBody: document.getElementById('tierModalBody'),
  flashBtn: document.getElementById('flashBtn'),
  flashBtnText: document.getElementById('flashBtnText'),
  flashCountdownCapsule: document.getElementById('flashCountdownCapsule'),
  flashCountdownValue: document.getElementById('flashCountdownValue'),
  cartBtn: document.getElementById('cartBtn'),
  cartLabel: document.getElementById('cartLabel'),
  cartValue: document.getElementById('cartValue'),
  userBtn: document.getElementById('userBtn'),
  userMenu: document.getElementById('userMenu'),
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
};


window.RUNTIME_STATE = state;
window.RUNTIME_REFS = els;
window.RUNTIME_STORAGE = STORAGE;
