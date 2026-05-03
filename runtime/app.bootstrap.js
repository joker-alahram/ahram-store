const RUNTIME_KEY = '__B2B_RUNTIME__';
const MODULE_FILES = [
  'runtime/helpers.runtime.js',
  'runtime/state.runtime.js',
  'runtime/runtime-registry.js',
  'runtime/render.runtime.js',
  'pricing/pricing.engine.js',
  'core/guards.js',
  'cart/cart.service.js',
  'cart.engine.js',
  'ui/pricing-box.js',
  'runtime/app.core.js',
  'runtime/header.runtime.js',
  'runtime/hero.runtime.js',
  'runtime/modal.runtime.js',
  'runtime/cart.runtime.js',
  'runtime/products.runtime.js',
  'runtime/companies.runtime.js',
  'runtime/tiers.runtime.js',
  'runtime/search.runtime.js',
  'runtime/navigation.runtime.js',
  'runtime/events.runtime.js',
  'runtime/utils.runtime.js',
  'runtime/render-orchestrator.runtime.js',
];

const bootState = window[RUNTIME_KEY] = window[RUNTIME_KEY] || {
  started: false,
  loaded: false,
  runtime: {},
};

if (!window.CONFIG) {
  window.CONFIG = {
    baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
    apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
    supportWhatsapp: localStorage.getItem('support_whatsapp') || '201040880002',
  };
}
bootState.runtime.CONFIG = window.CONFIG;

if (!window.STORAGE) {
  window.STORAGE = {
    session: 'b2b_session',
    cart: 'b2b_cart',
    tier: 'selected_tier',
    unitPrefs: 'b2b_unit_prefs',
    productQtyPrefs: 'b2b_product_qty_prefs',
    behavior: 'b2b_ui_behavior',
    dataCache: 'b2b_data_cache',
    selectedCustomer: 'b2b_selected_customer',
  };
}
bootState.runtime.STORAGE = window.STORAGE;

bootState.runtime.state = bootState.runtime.state || {
  view: { type: 'home' },
  search: '',
  companyFilter: null,
  pendingTierAction: null,
  pendingReturnHash: null,
  pendingOpenCart: false,
  activeProduct: null,
  activeDeal: null,
  session: null,
  cart: [],
  selectedTier: null,
  unitPrefs: {},
  productQtyPrefs: {},
  behaviorEvents: [],
  selectedCustomer: null,
  companies: [],
  products: [],
  dailyDeals: [],
  flashOffers: [],
  tiers: [],
  settings: [],
  settingMap: new Map(),
  companyMap: new Map(),
  productMap: new Map(),
  tierPrices: { carton: new Map(), pack: new Map() },
  topProducts: [],
  topCompanies: [],
  invoices: [],
  invoicesLoaded: false,
  customers: [],
  customersLoaded: false,
  checkoutStage: 'validate',
  uiEventWriteDisabled: false,
  timers: { flash: null },
  flashState: { status: null, remaining: '', offer: null, endedAt: '' },
};
bootState.runtime.els = bootState.runtime.els || {
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
  pageContent: document.getElementById('pageContent'),
  banner: document.getElementById('banner'),
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
bootState.runtime.readJSON = bootState.runtime.readJSON || ((_, fallback) => fallback);
bootState.runtime.writeJSON = bootState.runtime.writeJSON || (() => {});

bootState.runtime.toNumber = bootState.runtime.toNumber || ((value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
});
bootState.runtime.clone = bootState.runtime.clone || ((value) => (value == null ? value : JSON.parse(JSON.stringify(value))));
bootState.runtime.normalizeTierName = bootState.runtime.normalizeTierName || ((tier) => {
  if (!tier) return null;
  if (typeof tier === 'string') return tier.trim() || null;
  return String(tier.tier_name || tier.name || tier.tier || '').trim() || null;
});
bootState.runtime.buildTierPriceKey = bootState.runtime.buildTierPriceKey || ((tierName, productId) => {
  const tier = bootState.runtime.normalizeTierName(tierName);
  const pid = String(productId || '').trim();
  return tier && pid ? `${tier}::${pid}` : '';
});
bootState.runtime.freezePricing = bootState.runtime.freezePricing || ((snapshot) => Object.freeze({
  unit: Number(snapshot?.unit || 0),
  total: Number(snapshot?.total || 0),
  breakdown: Object.freeze({
    base: Number(snapshot?.breakdown?.base || 0),
    tier: Number(snapshot?.breakdown?.tier || 0),
    deals: Number(snapshot?.breakdown?.deals || 0),
    flash: Number(snapshot?.breakdown?.flash || 0),
    final: Number(snapshot?.breakdown?.final || 0),
  }),
  context: Object.freeze({ tier: snapshot?.context?.tier ?? null, appliedDeals: [], flashId: snapshot?.context?.flashId ?? null }),
  timestamp: Date.now(),
}));
bootState.runtime.resolvePrice = bootState.runtime.resolvePrice || ((input = {}) => {
  const qty = Math.max(1, Math.floor(Number(input.qty ?? 1)) || 1);
  const base = Number(input.product?.carton_price ?? input.product?.price ?? input.price ?? 0) || 0;
  const unit = Number.isFinite(Number(input.unitPrice)) ? Number(input.unitPrice) : base;
  return bootState.runtime.freezePricing({ unit, total: unit * qty, breakdown: { base, tier: 0, deals: 0, flash: 0, final: unit }, context: { tier: null, appliedDeals: [], flashId: null } });
});
bootState.runtime.resolveCartPricing = bootState.runtime.resolveCartPricing || ((cart = []) => Array.isArray(cart) ? cart : []);
bootState.runtime.addToCart = bootState.runtime.addToCart || ((engine, cart, input) => { cart.push(input); return input; });
bootState.runtime.updateCartItem = bootState.runtime.updateCartItem || ((engine, item, qty) => ({ ...item, qty }));
bootState.runtime.repriceCart = bootState.runtime.repriceCart || ((engine, cart) => Array.isArray(cart) ? cart : []);
bootState.runtime.normalizeCartState = bootState.runtime.normalizeCartState || ((engine, cart) => Array.isArray(cart) ? cart : []);
bootState.runtime.cartLineKey = bootState.runtime.cartLineKey || ((item = {}) => `${item.type || 'product'}:${item.id || item.productId || ''}:${item.unit || 'single'}`);
bootState.runtime.assertCartIntegrity = bootState.runtime.assertCartIntegrity || (() => true);
bootState.runtime.assertNoManualPricing = bootState.runtime.assertNoManualPricing || (() => true);
bootState.runtime.normalizeLegacyCart = bootState.runtime.normalizeLegacyCart || ((cart = []) => Array.isArray(cart) ? cart : []);
bootState.runtime.getCartTotals = bootState.runtime.getCartTotals || ((cart = []) => {
  const rows = Array.isArray(cart) ? cart : [];
  let total = 0;
  let eligible = 0;
  for (const item of rows) {
    const line = Number(item?.pricing?.total || 0);
    total += line;
    if (String(item?.type) === 'product') eligible += line;
  }
  return { total, eligible, products: eligible, deals: 0, flash: 0 };
});
bootState.runtime.cartTotal = bootState.runtime.cartTotal || ((cart = []) => bootState.runtime.getCartTotals(cart).total);
bootState.runtime.eligibleTierTotal = bootState.runtime.eligibleTierTotal || ((cart = []) => bootState.runtime.getCartTotals(cart).eligible);
bootState.runtime.cartTotals = bootState.runtime.cartTotals || ((cart = []) => bootState.runtime.getCartTotals(cart));
bootState.runtime.runtimeRegistry = bootState.runtime.runtimeRegistry || { CONFIG: bootState.runtime.CONFIG, STORAGE: bootState.runtime.STORAGE, els: bootState.runtime.els, state: bootState.runtime.state, readJSON: bootState.runtime.readJSON, writeJSON: bootState.runtime.writeJSON };

function parseImports(source) {
  const imports = [];
  const importRE = /^\s*import\s+([\s\S]*?)\s+from\s+['\"]([^'\"]+)['\"];?\s*$/gm;
  let match;
  while ((match = importRE.exec(source))) {
    const spec = match[1].trim();
    const from = match[2].trim();
    const names = [];
    const star = spec.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (star) {
      names.push(star[1]);
    } else {
      const named = spec.match(/^\{([\s\S]*)\}$/);
      if (named) {
        named[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((part) => {
          const alias = part.split(/\s+as\s+/i).map((s) => s.trim());
          names.push(alias[1] || alias[0]);
        });
      } else {
        names.push(spec.replace(/^default\s*,\s*/, '').trim());
      }
    }
    imports.push({ from, names });
  }
  return imports;
}

function stripImportsAndExports(source) {
  let out = source
    .replace(/^\s*import\s+[\s\S]*?from\s+['\"][^'\"]+['\"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'runtime.default = ')
    .replace(/^\s*export\s+(async\s+function\s+)/gm, '$1')
    .replace(/^\s*export\s+(function\s+)/gm, '$1')
    .replace(/^\s*export\s+(const\s+)/gm, '$1')
    .replace(/^\s*export\s+(let\s+)/gm, '$1')
    .replace(/^\s*export\s+(class\s+)/gm, '$1')
    .replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, '');
  return out;
}

function collectLocalNames(source) {
  const names = new Set();
  const declPatterns = [
    /^(?:\s*)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm,
    /^(?:\s*)const\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)let\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)var\s+([A-Za-z_$][\w$]*)\s*=/gm,
    /^(?:\s*)class\s+([A-Za-z_$][\w$]*)\b/gm,
  ];
  for (const re of declPatterns) {
    let match;
    while ((match = re.exec(source))) names.add(match[1]);
  }
  return [...names];
}

function buildModuleFactory(source, filePath) {
  const imports = parseImports(source);
  const locals = collectLocalNames(source);
  const body = stripImportsAndExports(source);
  return new Function('runtime', `with (runtime) {\n${body}\n;${locals.map((name) => `if (typeof ${name} !== 'undefined') runtime[${JSON.stringify(name)}] = ${name};`).join('\n')}\n}`);
}

async function loadText(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load module: ${path}`);
  return response.text();
}

async function loadModule(path) {
  const source = await loadText(path);
  const factory = buildModuleFactory(source, path);
  factory(bootState.runtime);
}

function finalizeRuntime() {
  const runtime = bootState.runtime;
  if (!runtime.CONFIG) runtime.CONFIG = window.CONFIG;
  if (runtime.state && !runtime.state.view) runtime.state.view = { type: 'home' };
  if (runtime.state && !runtime.state.productMap) runtime.state.productMap = new Map();
  if (typeof runtime.state?.cart !== 'undefined' && !Array.isArray(runtime.state.cart)) runtime.state.cart = [];
  runtime.startApplication = startApplication;
  window.startApplication = startApplication;
}

async function startApplication() {
  if (bootState.started) return;
  bootState.started = true;

  for (const path of MODULE_FILES) {
    await loadModule(path);
  }

  finalizeRuntime();
  const runtime = bootState.runtime;

  const initOrder = [
    'initHeaderRuntime',
    'initHeroRuntime',
    'initModalRuntime',
    'initCartRuntime',
    'initSearchRuntime',
    'initNavigationRuntime',
  ];

  for (const name of initOrder) {
    if (typeof runtime[name] === 'function') {
      try { runtime[name](); } catch (error) { console.warn(`${name}.failed`, error); }
    }
  }

  if (typeof runtime.loadData === 'function') {
    await runtime.loadData();
  }

  if (typeof runtime.handleRoute === 'function') {
    await runtime.handleRoute();
  } else if (typeof runtime.renderApp === 'function') {
    runtime.renderApp();
  }
}

const boot = () => {
  if (bootState.loaded) return;
  bootState.loaded = true;
  startApplication().catch((error) => {
    console.error('startup.failed', error);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
