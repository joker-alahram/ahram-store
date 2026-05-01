const CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: localStorage.getItem('support_whatsapp') || '201040880002',
};

const STORAGE = {
  session: 'b2b_session',
  cart: 'b2b_cart',
  tier: 'selected_tier',
  unitPrefs: 'b2b_unit_prefs',
  productQtyPrefs: 'b2b_product_qty_prefs',
  behavior: 'b2b_ui_behavior',
  dataCache: 'b2b_data_cache',
};

const state = {
  view: parseHash(),
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
  behaviorEvents: loadJSON(STORAGE.behavior, []),
  topProducts: [],
  topCompanies: [],
  activeProduct: null,
  activeDeal: null,
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

const els = {
  mainHeader: document.getElementById('mainHeader'),
  banner: document.getElementById('banner'),
  searchBar: document.getElementById('searchBar'),
  pageContent: document.getElementById('pageContent'),
  registerPage: document.getElementById('registerPage'),
  homeBtn: document.getElementById('homeBtn'),
  productModal: document.getElementById('productModal'),
  productModalCard: document.getElementById('productModalCard'),
  productModalBody: document.getElementById('productModalBody'),
  productModalTitle: document.getElementById('productModalTitle'),
  productModalClose: document.getElementById('productModalClose'),
  productModalAction: document.getElementById('productModalAction'),
  productModalSecondary: document.getElementById('productModalSecondary'),
  tierBtn: document.getElementById('tierBtn'),
  dealsBtn: document.getElementById('dealsBtn'),
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

let dynamicTimer = null;
let salesPulseTimer = null;

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseHash() {
  const raw = decodeURIComponent(location.hash || '#home').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length || parts[0] === 'home') return { type: 'home' };
  if (parts[0] === 'company' && parts[1]) return { type: 'company', companyId: parts[1] };
  if (parts[0] === 'tiers') return { type: 'tiers' };
  if (parts[0] === 'deals') return { type: 'deals' };
  if (parts[0] === 'flash') return { type: 'flash' };
  if (parts[0] === 'invoices') return { type: 'invoices' };
  if (parts[0] === 'my-customers') return { type: 'my-customers' };
  if (parts[0] === 'register') return { type: 'register' };
  return { type: 'home' };
}

function navigate(hash) {
  const nextHash = hash || '#home';
  if (location.hash === nextHash) {
    handleRoute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  location.hash = nextHash;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function num(value, digits = 2) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: n % 1 === 0 ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function integer(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]+/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch));
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().trim();
}

function placeholderImage(seed = 'item') {
  const text = encodeURIComponent(String(seed).slice(0, 24) || 'item');
  return `https://via.placeholder.com/640x640/111827/f3d88b?text=${text}`;
}

function sanitizeToastMessage(message) {
  return String(message ?? '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NOTIFY_LIMITS = {
  short: 3000,
  medium: 4000,
  long: 5000,
};

const NOTIFY_TYPE_META = {
  success: {
    label: 'نجاح',
    icon: '✓',
  },
  warning: {
    label: 'تنبيه',
    icon: '!',
  },
  error: {
    label: 'خطأ',
    icon: '×',
  },
  info: {
    label: 'معلومة',
    icon: 'i',
  },
};

let notificationQueue = [];
let activeNotification = null;
let notificationHideTimer = null;
let notificationTransitionTimer = null;
let notificationSeq = 0;
let lastNotifySignature = '';
let lastNotifyTs = 0;

function inferNotifyType(payload = {}) {
  if (payload.type && NOTIFY_TYPE_META[payload.type]) return payload.type;
  const blob = normalizeText([payload.title, payload.message].filter(Boolean).join(' '));
  if (/\b(success|نجح|تم|أضيف|حفظ|اتسجل|دخل|ثبت|ok)\b/.test(blob)) return 'success';
  if (/\b(error|خطأ|فشل|تعذر|تعذّر|failed|network|connection|اتصال)\b/.test(blob)) return 'error';
  if (/\b(تحقق|تنبيه|انتبه|تأكد|مطلوب|ناقص|لازم|قرب|قريبة|محتوى)\b/.test(blob)) return 'warning';
  return 'info';
}

function inferNotifyDuration(payload = {}) {
  if (Number.isFinite(payload.duration) && payload.duration > 0) return payload.duration;
  const text = sanitizeToastMessage([payload.title, payload.message].filter(Boolean).join(' '));
  if (!text) return NOTIFY_LIMITS.short;
  if (text.length <= 58) return NOTIFY_LIMITS.short;
  if (text.length <= 112) return NOTIFY_LIMITS.medium;
  return NOTIFY_LIMITS.long;
}

function buildNotifySignature(payload = {}) {
  return [payload.type || 'info', sanitizeToastMessage(payload.title || ''), sanitizeToastMessage(payload.message || '')].join('|');
}

function buildNotifyNode(payload = {}) {
  const type = inferNotifyType(payload);
  const meta = NOTIFY_TYPE_META[type] || NOTIFY_TYPE_META.info;
  const title = sanitizeToastMessage(payload.title || meta.label || '');
  const message = sanitizeToastMessage(payload.message || '');
  const action = payload.action && typeof payload.action === 'object' ? payload.action : null;

  const node = document.createElement('div');
  node.className = `notify notify-${type}`;
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  node.setAttribute('aria-atomic', 'true');
  node.innerHTML = `
    <div class="notify-mark" aria-hidden="true">${escapeHtml(meta.icon)}</div>
    <div class="notify-body">
      ${title ? `<div class="notify-title">${escapeHtml(title)}</div>` : ''}
      ${message ? `<div class="notify-message">${escapeHtml(message)}</div>` : ''}
    </div>
    ${action && action.label ? `<button type="button" class="notify-action">${escapeHtml(action.label)}</button>` : ''}
  `;

  if (action && typeof action.onClick === 'function') {
    const actionBtn = node.querySelector('.notify-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', (event) => {
        event.preventDefault();
        try {
          action.onClick();
        } catch (error) {
          console.warn('notify action error:', error);
        }
      });
    }
  }

  return { node, type };
}

function renderNotify(payload = {}) {
  const host = els.toast;
  if (!host) return;
  host.classList.remove('hidden');
  host.innerHTML = '';
  const { node } = buildNotifyNode(payload);
  host.appendChild(node);
}

function clearActiveNotification(immediate = false) {
  clearTimeout(notificationHideTimer);
  clearTimeout(notificationTransitionTimer);
  notificationHideTimer = null;
  notificationTransitionTimer = null;

  if (!els.toast) return;
  const current = els.toast.querySelector('.notify');
  if (!current) {
    els.toast.classList.add('hidden');
    activeNotification = null;
    return;
  }

  current.classList.remove('is-visible');
  current.classList.add('is-hiding');

  const finish = () => {
    if (els.toast) {
      els.toast.innerHTML = '';
      els.toast.classList.add('hidden');
    }
    activeNotification = null;
    notificationTransitionTimer = null;
    showNextNotification();
  };

  if (immediate) {
    finish();
    return;
  }

  notificationTransitionTimer = setTimeout(finish, 220);
}

function showNextNotification() {
  if (!els.toast || activeNotification) return;
  const next = notificationQueue.shift();
  if (!next) {
    els.toast.classList.add('hidden');
    return;
  }

  activeNotification = next;
  renderNotify(next.payload);
  const node = els.toast.querySelector('.notify');
  if (!node) {
    activeNotification = null;
    return;
  }

  requestAnimationFrame(() => node.classList.add('is-visible'));
  clearTimeout(notificationHideTimer);
  notificationHideTimer = setTimeout(() => clearActiveNotification(false), next.duration);
}

function updateActiveNotification(payload, duration) {
  if (!els.toast) return;
  activeNotification = { ...activeNotification, payload: { ...activeNotification.payload, ...payload }, duration };
  renderNotify(activeNotification.payload);
  const node = els.toast.querySelector('.notify');
  if (node) requestAnimationFrame(() => node.classList.add('is-visible'));
  clearTimeout(notificationHideTimer);
  notificationHideTimer = setTimeout(() => clearActiveNotification(false), duration);
}

function notify(payload = {}) {
  const normalizedPayload = {
    type: inferNotifyType(payload),
    title: sanitizeToastMessage(payload.title || ''),
    message: sanitizeToastMessage(payload.message || ''),
    duration: inferNotifyDuration(payload),
    action: payload.action || null,
  };

  if (!normalizedPayload.title && !normalizedPayload.message) return false;

  const signature = buildNotifySignature(normalizedPayload);
  const now = Date.now();
  const isDuplicate = signature === lastNotifySignature && (now - lastNotifyTs) < 1200;
  lastNotifySignature = signature;
  lastNotifyTs = now;

  if (activeNotification && buildNotifySignature(activeNotification.payload) === signature) {
    updateActiveNotification(normalizedPayload, normalizedPayload.duration);
    return true;
  }

  if (isDuplicate) {
    if (activeNotification) {
      updateActiveNotification(normalizedPayload, Math.max(activeNotification.duration || 0, normalizedPayload.duration));
    }
    return true;
  }

  const queuedIndex = notificationQueue.findIndex((item) => buildNotifySignature(item.payload) === signature);
  if (queuedIndex >= 0) {
    notificationQueue[queuedIndex] = { payload: normalizedPayload, duration: normalizedPayload.duration };
  } else if (activeNotification) {
    notificationQueue.push({ payload: normalizedPayload, duration: normalizedPayload.duration });
  } else {
    notificationQueue.unshift({ payload: normalizedPayload, duration: normalizedPayload.duration });
  }

  showNextNotification();
  return true;
}

function toast(message, options = {}) {
  return notify({
    type: options.type || 'info',
    message,
    title: options.title || '',
    duration: options.duration,
    action: options.action,
  });
}

const personas = [
  " ",
  "  ",
  " ",
  " ",
  " ",
  " ",
  " ",
  "  ",
  " ",
  " ",
];

const SALES_SEEDS = {
  login: {
    success: [
      "أهلاً بيك، حسابك دخل بنجاح.",
      "نورّت الصفحة، جاهز نكمل الشغل.",
      "تم الدخول، يلا على الطلب.",
      "حسابك اشتغل تمام، اتفضل.",
      "الدخول نجح، وخلينا نبدأ صح.",
    ],
    error: [
      "البيانات مش مظبوطة، راجعها بسرعة.",
      "فيه حاجة ناقصة في الدخول.",
      "اليوزر أو الباسورد مش متطابق.",
      "تسجيل الدخول فشل، جرّب تاني.",
      "محتاج بيانات أدق عشان ندخل.",
    ],
    missing: [
      "كمّل اليوزر والباسورد الأول.",
      "الحق البيانات الناقصة قبل الدخول.",
      "اكتب كل خانات الدخول.",
      "محتاج رقم أو اسم مع الباسورد.",
      "لسه ناقصك جزء من بيانات الدخول.",
    ],
  },
  register: {
    success: [
      "الحساب اتعمل وده بداية نظيفة.",
      "تم التسجيل، وطلبك جاهز يتحرك.",
      "أهلاً بيك عميل جديد عندنا.",
      "التسجيل كمل، ونورتنا.",
      "اتسجلت بنجاح، وخلينا نسهّلها عليك.",
    ],
    error: [
      "راجع الاسم والرقم والعنوان.",
      "فيه بيانات محتاجة تتظبط.",
      "السجل وقف بسبب معلومة ناقصة.",
      "التفاصيل مش مكتملة لسه.",
      "استكمل الحقول المطلوبة الأول.",
    ],
    duplicate: [
      "رقمك موجود قبل كده، استخدم الدخول.",
      "الحساب ده متسجل بالفعل.",
      "الرقم ده عليه حساب من قبل.",
      "عندك تسجيل قديم، ادخل عليه.",
      "ماينفعش نكرر نفس الرقم مرتين.",
    ],
  },
  cart: {
    empty: [
      "السلة فاضية، زوّد شوية.",
      "لسه ما اخترتش حاجة تنزل السلة.",
      "ابدأ بمنتج واحد على الأقل.",
      "السلة محتاجة أول خطوة.",
      "مفيش أصناف هنا لحد دلوقتي.",
    ],
    add: [
      "اتضاف للسلة بنجاح.",
      "تمام، الصنف دخل السلة.",
      "كده الطلب بدأ يتحرك.",
      "إضافة مظبوطة، كمل.",
      "حلو، المنتج بقى جوه السلة.",
    ],
    remove: [
      "تمت الإزالة من السلة.",
      "شيلناه من الطلب.",
      "الصنف خرج من السلة.",
      "اتمسح من الاختيارات.",
      "تم حذف المنتج من الطلب.",
    ],
    idle: [
      "السلة هادية، زوّد حاجة تكسب أكثر.",
      "فيه مساحة لمنتج تاني يفرق في الخصم.",
      "اطمّن على السلة، ممكن تزود مكسبك.",
      "الطلب محتاج لمسة زيادة.",
      "إضافة صنف كمان ممكن تغيّر الإجمالي.",
    ],
    filled: [
      "السلة جاهزة وتستاهل تكمّل.",
      "كويس، بقى عندك طلب محترم.",
      "الطلب داخل منطقة التسعير الصح.",
      "كده السلة شكلها قوي.",
      "ممتاز، أنت قريب من الإرسال.",
    ],
  },
  tier: {
    missing: [
      "اختار شريحة الأول عشان تاخد الخصم.",
      "من غير شريحة مش هنستفاد من الميزة.",
      "الشريحة لسه مختارة؟",
      "حدد الشريحة المناسبة الأول.",
      "شريحة الجملة لازم تتفعل قبل الإرسال.",
    ],
    incomplete: [
      "فاضلك شوية وتكمل الشريحة.",
      "لسه أقل من الحد الأدنى.",
      "قربت، زوّد شوية بس.",
      "إجمالي الطلب محتاج يكبر سنة.",
      "أنت قريب من خصم الشريحة.",
    ],
    almost: [
      "قربت جدًا من الحد الأدنى.",
      "فاضل رقم بسيط وتدخل الشريحة.",
      "شوية زيادة وهتثبت الخصم.",
      "العجز صغير جدًا، كملها.",
      "أنت على الباب مباشرة.",
    ],
    selected: [
      "الشريحة اتثبتت، ممتاز.",
      "اختيار الشريحة تم بنجاح.",
      "كده الخصم بقى شغال.",
      "الأسعار نزلت على الشريحة الصح.",
      "اختيار موفق، كمل الطلب.",
    ],
  },
  deals: {
    suggest: [
      "بص على صفقة اليوم، فيها حركة.",
      "متفوتش العرض، ممكن يكون مناسب.",
      "العروض هنا ممكن تزوّد المكسب.",
      "افتح صفقة اليوم قبل ما تكمل.",
      "فيه فرصة شغل كويسة فوق.",
    ],
    active: [
      "عرض الساعة شغال دلوقتي.",
      "العرض الناري مفتوح حالياً.",
      "الوقت شغال ضدك، العرض فعال.",
      "المؤقت شغال، راجع العرض.",
      "العرض مستنيك قبل ما يخلص.",
    ],
  },
  checkout: {
    validate: [
      "راجع الشروط قبل الدفع.",
      "التحقق لسه محتاج خطوة.",
      "فيه شرط لازم يتقفل الأول.",
      "قبل الإرسال لازم نراجع الطلب.",
      "مراجعة سريعة قبل ما نطلع الفاتورة.",
    ],
    missing: [
      "فيه بيانات ناقصة قبل الإرسال.",
      "راجع العميل أو الشريحة.",
      "الإرسال متوقف على معلومة ناقصة.",
      "الطلب محتاج استكمال بسيط.",
      "مفيش إتمام قبل تصحيح البيانات.",
    ],
    blocked: [
      "الطلب اتوقف عشان الحد الأدنى.",
      "ماينفعش نطلع الطلب بالشكل ده.",
      "التحقق رافض الطلب حالياً.",
      "لازم تقفل الشريحة الأول.",
      "الطلب محتاج استيفاء قبل الإرسال.",
    ],
  },
  success: {
    order: [
      "الطلب اتسجل وتمام.",
      "الفاتورة اتجهزت بنجاح.",
      "كل حاجة مشت صح لحد آخر خطوة.",
      "الطلب خرج بنجاح.",
      "تم إنشاء الطلب بدون مشاكل.",
    ],
    whatsapp: [
      "الفاتورة راحت على واتساب.",
      "تم الإرسال على الواتساب.",
      "الملخص اتبعت للمستفيد.",
      "واتساب استقبل الفاتورة.",
      "الإرسال على الواتساب تم.",
    ],
    login: [
      "الدخول نجح، وخلينا نبيع.",
      "حسابك فاتح وجاهز.",
      "أهلاً بيك، الطلب قدامك.",
      "الدخول تم، نكمّل البيع.",
      "الـSession اشتغلت صح.",
    ],
    register: [
      "الحساب الجديد اتفعل.",
      "التسجيل كمل ونورت.",
      "المستخدم الجديد بقى جاهز.",
      "حسابك اتسجل بنجاح.",
      "تم فتح الحساب الجديد.",
    ],
  },
  errors: {
    generic: [
      "فيه خطأ محتاج مراجعة.",
      "حصلت مشكلة بسيطة، جرّب تاني.",
      "فيه حاجة وقفت التنفيذ.",
      "المعالجة فشلت مؤقتًا.",
      "راجع الخطوة دي تاني.",
    ],
    network: [
      "النت مش مساعد دلوقتي.",
      "فيه مشكلة اتصال مؤقتة.",
      "تعذر الوصول للسيرفر.",
      "الطلب علق بسبب الشبكة.",
      "انتظر ثواني وجرّب تاني.",
    ],
  },
};

function buildSalesEngine(seeds) {
  const out = {};
  Object.entries(seeds).forEach(([section, groups]) => {
    out[section] = {};
    Object.entries(groups).forEach(([kind, templates]) => {
      out[section][kind] = personas.flatMap((persona) => templates.map((template) => `${persona} — ${template}`));
    });
  });
  return out;
}

const SALES_ENGINE = buildSalesEngine(SALES_SEEDS);
let lastTime = 0;

function canShowMessage() {
  const now = Date.now();
  if (now - lastTime < 15000) return false;
  lastTime = now;
  return true;
}

function getSmartPool(type) {
  if (!type) return [];
  const parts = String(type).split('.');
  let cursor = SALES_ENGINE;
  for (const part of parts) {
    cursor = cursor?.[part];
    if (!cursor) return [];
  }
  return Array.isArray(cursor) ? cursor : [];
}

function getSmartMessage(type) {
  const pool = getSmartPool(type);
  if (!pool.length) return null;
  const last = sessionStorage.getItem('last_msg');
  const filtered = pool.filter((m) => m !== last);
  const bag = filtered.length ? filtered : pool;
  const msg = bag[Math.floor(Math.random() * bag.length)];
  sessionStorage.setItem('last_msg', msg);
  return msg;
}

function smartToast(typeOrMessage, fallback, force = false) {
  const isEngineType = typeof typeOrMessage === 'string' && getSmartPool(typeOrMessage).length > 0;
  const message = isEngineType ? (getSmartMessage(typeOrMessage) || fallback || '') : (fallback ?? typeOrMessage);

  if (!message) return false;
  if ((isEngineType || force) && !force && !canShowMessage()) return false;

  toast(message);
  sessionStorage.setItem('last_msg', message);
  return true;
}

function salesBehavior(category, kind, fallback) {
  return smartToast(`${category}.${kind}`, fallback);
}

function randomDelay() {
  return 25000 + Math.floor(Math.random() * 15000);
}

const INVOICE_COUNTER_STORAGE = 'b2b_invoice_counter';

function isNumericLike(value) {
  return /^\d+$/.test(String(value ?? '').trim());
}

function compareNatural(a, b) {
  return String(a ?? '').trim().localeCompare(String(b ?? '').trim(), 'en', { numeric: true, sensitivity: 'base' });
}

function sortCompanies(rows = []) {
  return [...rows].sort((a, b) => compareNatural(a.company_id ?? a.id ?? '', b.company_id ?? b.id ?? ''));
}

function sortProducts(rows = []) {
  return [...rows].sort((a, b) => compareNatural(a.product_name ?? '', b.product_name ?? ''));
}

async function syncInvoiceSequence() {
  const cached = Number(localStorage.getItem(INVOICE_COUNTER_STORAGE) || 0);
  let nextValue = Number.isFinite(cached) && cached >= 20000 ? cached : 20000;
  try {
    const latest = await apiGet('orders', { select: 'order_number', order: 'id.desc', limit: '1' }).catch(() => []);
    const latestNumber = String(latest?.[0]?.order_number ?? '').trim();
    if (isNumericLike(latestNumber)) nextValue = Math.max(nextValue, Number(latestNumber) + 1);
  } catch {}
  localStorage.setItem(INVOICE_COUNTER_STORAGE, String(nextValue));
  return nextValue;
}

async function reserveInvoiceNumber() {
  const current = Number(localStorage.getItem(INVOICE_COUNTER_STORAGE) || 20000);
  const safeCurrent = Number.isFinite(current) && current >= 20000 ? current : 20000;
  localStorage.setItem(INVOICE_COUNTER_STORAGE, String(safeCurrent + 1));
  return safeCurrent;
}

function persistBehaviorEvents() {
  saveJSON(STORAGE.behavior, state.behaviorEvents.slice(-1000));
}

function recordUiEvent(type, detail = {}) {
  const ts = Date.now();
  const event = {
    id: `${ts}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    ts,
    page: state.view?.type || parseHash().type || 'home',
    user_id: state.session?.id || null,
    user_type: state.session?.userType || null,
    session_id: state.session?.id || null,
    ...detail,
  };

  state.behaviorEvents.push(event);
  if (state.behaviorEvents.length > 1000) {
    state.behaviorEvents.splice(0, state.behaviorEvents.length - 1000);
  }
  persistBehaviorEvents();

  if (state.uiEventWriteDisabled) return event;

  // Best-effort backend write. Keep payload minimal to match the existing schema.
  const entityType = detail.entityType || String(type || '').split('.')[0] || 'ui';
  apiPost('ui_events', {
    event_type: type,
    entity_type: entityType,
    created_at: new Date(ts).toISOString(),
  }).catch((error) => {
    state.uiEventWriteDisabled = true;
    console.warn('ui_events write disabled:', error);
  });

  return event;
}

function getProductById(productId) {
  return state.products.find((item) => String(item.product_id) === String(productId)) || null;
}

function getBackendProductMap() {
  const map = new Map();
  for (const row of state.topProducts || []) {
    const id = String(row.product_id || row.id || row.product || row.productId || '').trim();
    if (!id) continue;
    map.set(id, row);
  }
  return map;
}

function getBehaviorStats() {
  const productStats = new Map();
  const companyStats = new Map();
  const pageStats = new Map();

  for (const event of state.behaviorEvents || []) {
    const type = String(event.type || '').toLowerCase();
    const productId = event.productId ? String(event.productId) : '';
    const companyId = event.companyId ? String(event.companyId) : '';

    if (productId) {
      const bucket = productStats.get(productId) || {
        views: 0,
        details: 0,
        adds: 0,
        removes: 0,
        searches: 0,
        checkout: 0,
        lastTs: 0,
        companyId,
      };

      if (type === 'product.view' || type === 'product.impression') bucket.views += 1;
      if (type === 'product.details') bucket.details += 1;
      if (type === 'cart.add') bucket.adds += 1;
      if (type === 'cart.remove') bucket.removes += 1;
      if (type === 'checkout.submit') bucket.checkout += 1;

      bucket.lastTs = Math.max(bucket.lastTs, Number(event.ts || 0));
      bucket.companyId = bucket.companyId || companyId;
      productStats.set(productId, bucket);
    }

    if (companyId) {
      const bucket = companyStats.get(companyId) || { views: 0, clicks: 0, lastTs: 0 };
      if (type === 'company.view' || type === 'company.open') bucket.views += 1;
      if (type === 'company.click') bucket.clicks += 1;
      bucket.lastTs = Math.max(bucket.lastTs, Number(event.ts || 0));
      companyStats.set(companyId, bucket);
    }

    if (type === 'page.view' || type === 'route.change') {
      const key = String(event.page || 'home');
      pageStats.set(key, (pageStats.get(key) || 0) + 1);
    }
  }

  return { productStats, companyStats, pageStats };
}

function productScore(product) {
  const { productStats } = getBehaviorStats();
  const row = productStats.get(String(product.product_id)) || {};
  const backendMap = getBackendProductMap();
  const backendRow = backendMap.get(String(product.product_id)) || {};

  const views = Number(row.views || 0);
  const details = Number(row.details || 0);
  const adds = Number(row.adds || 0);
  const removes = Number(row.removes || 0);
  const checkout = Number(row.checkout || 0);
  const backendSales = Number(
    backendRow.total_qty ||
    backendRow.qty ||
    backendRow.sold_count ||
    backendRow.sales_count ||
    backendRow.sales ||
    backendRow.total_sales ||
    0
  );

  const sameCompanyBonus = currentCartCompanyIds().has(String(product.company_id)) ? 2.5 : 0;
  const recencyBonus = row.lastTs ? Math.max(0, 4 - ((Date.now() - row.lastTs) / 86400000)) : 0;

  return (views * 1.2) + (details * 2.1) + (adds * 4.2) + (checkout * 5.5) + (backendSales * 3.5) - (removes * 1.5) + sameCompanyBonus + recencyBonus;
}

function currentCartCompanyIds() {
  const ids = new Set();
  for (const item of state.cart || []) {
    if (item.type !== 'product') continue;
    const product = getProductById(item.id);
    if (product?.company_id) ids.add(String(product.company_id));
  }
  return ids;
}

function rankProducts(products, limit = 8, scorer = productScore) {
  return [...products]
    .filter(Boolean)
    .sort((a, b) => scorer(b) - scorer(a) || compareNatural(a.product_name, b.product_name))
    .slice(0, limit);
}

function topViewedProducts(limit = 8) {
  const { productStats } = getBehaviorStats();
  return [...state.products]
    .sort((a, b) => {
      const av = Number(productStats.get(String(a.product_id))?.views || 0);
      const bv = Number(productStats.get(String(b.product_id))?.views || 0);
      return bv - av || compareNatural(a.product_name, b.product_name);
    })
    .slice(0, limit);
}

function topRecommendedProducts(limit = 8) {
  return rankProducts(state.products, limit);
}

function topBestSellingProducts(limit = 8) {
  const backendMap = getBackendProductMap();
  const ranked = [];
  for (const row of state.topProducts || []) {
    const id = String(row.product_id || row.id || row.product || row.productId || '').trim();
    if (!id) continue;
    const product = getProductById(id);
    if (!product) continue;
    ranked.push({ product, row });
  }

  if (ranked.length) {
    ranked.sort((a, b) => {
      const as = Number(a.row.total_qty || a.row.qty || a.row.sold_count || a.row.sales_count || a.row.sales || 0);
      const bs = Number(b.row.total_qty || b.row.qty || b.row.sold_count || b.row.sales_count || b.row.sales || 0);
      return bs - as || compareNatural(a.product.product_name, b.product.product_name);
    });
    return ranked.slice(0, limit).map((item) => item.product);
  }

  return [...state.products]
    .sort((a, b) => {
      const as = Number(backendMap.get(String(a.product_id))?.sold_count || backendMap.get(String(a.product_id))?.sales_count || 0);
      const bs = Number(backendMap.get(String(b.product_id))?.sold_count || backendMap.get(String(b.product_id))?.sales_count || 0);
      return bs - as || compareNatural(a.product_name, b.product_name);
    })
    .slice(0, limit);
}

function cartCompanionProducts(limit = 8) {
  const cartCompanyIds = currentCartCompanyIds();
  const cartProductIds = new Set((state.cart || []).filter((item) => item.type === 'product').map((item) => String(item.id)));
  const base = [...state.products].filter((product) => !cartProductIds.has(String(product.product_id)));
  if (!cartCompanyIds.size) return rankProducts(base, limit);

  return base
    .sort((a, b) => {
      const aa = cartCompanyIds.has(String(a.company_id)) ? 1 : 0;
      const bb = cartCompanyIds.has(String(b.company_id)) ? 1 : 0;
      return bb - aa || productScore(b) - productScore(a) || compareNatural(a.product_name, b.product_name);
    })
    .slice(0, limit);
}

function companyBackedProducts(companyId, limit = 8) {
  return [...state.products]
    .filter((product) => String(product.company_id) === String(companyId))
    .sort((a, b) => productScore(b) - productScore(a) || compareNatural(a.product_name, b.product_name))
    .slice(0, limit);
}

function bestCompanyCards(limit = 8) {
  if (state.topCompanies && state.topCompanies.length) {
    const ranked = [];
    for (const row of state.topCompanies) {
      const id = String(row.company_id || row.id || row.company || row.companyId || '').trim();
      if (!id) continue;
      const company = state.companies.find((item) => String(item.company_id) === id);
      if (!company) continue;
      ranked.push({ company, row });
    }

    if (ranked.length) {
      ranked.sort((a, b) => {
        const as = Number(a.row.total_sales || a.row.sales || a.row.total_qty || a.row.qty || a.row.count || 0);
        const bs = Number(b.row.total_sales || b.row.sales || b.row.total_qty || b.row.qty || b.row.count || 0);
        return bs - as || compareNatural(a.company.company_name, b.company.company_name);
      });
      return ranked.slice(0, limit).map((item) => item.company);
    }
  }

  const totals = new Map();
  for (const product of state.products || []) {
    const companyId = String(product.company_id || '');
    if (!companyId) continue;
    const score = productScore(product);
    totals.set(companyId, (totals.get(companyId) || 0) + score);
  }
  return [...state.companies]
    .sort((a, b) => (totals.get(String(b.company_id)) || 0) - (totals.get(String(a.company_id)) || 0) || compareNatural(a.company_name, b.company_name))
    .slice(0, limit);
}

function openProductModal(productId) {
  const product = typeof productId === 'object' ? productId : getProductById(productId);
  if (!product) return;

  state.activeDeal = null;
  state.activeProduct = product;
  recordUiEvent('product.details', { productId: product.product_id, companyId: product.company_id });

  const unit = currentUnitForProduct(product);
  const inCart = Boolean(findCartItem(cartKey({ type: 'product', id: product.product_id, unit })));
  const priceText = displayPriceText(product, unit);
  const unitText = unit === 'carton' ? 'كرتونة' : 'دستة';

  els.productModalTitle.textContent = product.product_name;
  els.productModalBody.innerHTML = `
    <div class="modal-hero">
      <img src="${escapeHtml(product.product_image || placeholderImage(product.product_name))}" alt="${escapeHtml(product.product_name)}" class="modal-image" />
      <div class="modal-meta">
        <div class="badge-row">
          <span class="badge">${escapeHtml(companyName(product.company_id))}</span>
          <span class="badge">${escapeHtml(unitText)}</span>
        </div>
        <div class="price-main">${escapeHtml(priceText)} ج.م</div>
        <p class="helper-text">${escapeHtml(product.allow_discount === false ? 'غير قابل للخصم' : 'قابل للتسعير حسب الشريحة')}</p>
      </div>
    </div>
  `;

  els.productModalAction.textContent = inCart ? 'إزالة من السلة' : 'شراء';
  els.productModalAction.setAttribute('data-action', 'toggle-product');
  els.productModalAction.setAttribute('data-product-id', product.product_id);
  els.productModalAction.removeAttribute('data-id');
  els.productModalSecondary.textContent = 'إغلاق';
  setOverlay(els.productModal, true);
}

function openOfferModal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((row) => String(row.id) === String(id));
  if (!item) return;

  state.activeProduct = null;
  state.activeDeal = item;
  recordUiEvent(`${type}.details`, { offerId: item.id, companyId: item.company_id || null });

  const canBuy = Boolean(item.can_buy);
  const actionLabel = type === 'deal' ? 'شراء الآن' : 'شراء الآن';
  const buttonLabel = canBuy ? (findCartItem(`${type}:${item.id}:single`) ? 'إزالة من السلة' : actionLabel) : 'انتهى العرض';

  els.productModalTitle.textContent = item.title;
  els.productModalBody.innerHTML = `
    <div class="modal-hero">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" class="modal-image" />
      <div class="modal-meta">
        <div class="badge-row">
          <span class="badge">${escapeHtml(type === 'deal' ? 'صفقة اليوم' : 'عرض الساعة')}</span>
          <span class="badge">${escapeHtml(type === 'flash' ? (item.status === 'active' ? 'نشط الآن' : item.status === 'expired' ? 'منتهي' : 'قريبًا') : (item.can_buy ? 'متاح' : 'غير متاح'))}</span>
        </div>
        <div class="price-main">${num(item.price)} ج.م</div>
        <p class="helper-text">${escapeHtml(item.description || '')}</p>
      </div>
    </div>
  `;

  els.productModalAction.textContent = buttonLabel;
  els.productModalAction.setAttribute('data-action', type === 'deal' ? 'toggle-deal' : 'toggle-flash');
  els.productModalAction.setAttribute('data-id', item.id);
  els.productModalAction.removeAttribute('data-product-id');
  els.productModalSecondary.textContent = 'إغلاق';
  setOverlay(els.productModal, true);
}

function closeProductModal() {
  setOverlay(els.productModal, false);
  state.activeProduct = null;
  state.activeDeal = null;
}

function escapeIfText(value) {
  return escapeHtml(value ?? '');
}

function normalizedProductRows(rows) {
  return (rows || [])
    .map((row) => getProductById(row.product_id || row.id || row.product || row.productId))
    .filter(Boolean);
}

function renderProductShelf(title, subLabel, products, options = {}) {
  const {
    kind = 'recommended',
    moreHash = '#home',
    moreLabel = 'عرض الكل',
    badge = '',
    actionLabel = 'شراء',
    compact = true,
  } = options;

  const items = (products || []).filter(Boolean);
  return `
    <section class="shelf-card">
      <div class="shelf-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subLabel ? `<div class="helper-text">${escapeHtml(subLabel)}</div>` : ''}
        </div>
        ${moreLabel ? `<button class="ghost-btn shelf-more" type="button" data-action="shelf-more" data-hash="${escapeHtml(moreHash)}">${escapeHtml(moreLabel)}</button>` : ''}
      </div>
      <div class="shelf-grid shelf-grid-${escapeHtml(kind)}">
        ${items.length ? items.map((product) => compact ? compactProductCardHtml(product, { badge, actionLabel }) : productCardHtml(product)).join('') : `<div class="empty-state">لا توجد عناصر بعد</div>`}
      </div>
    </section>
  `;
}

function compactProductCardHtml(product, options = {}) {
  const actionLabel = options.actionLabel || 'شراء';
  const unit = currentUnitForProduct(product);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const inCart = Boolean(findCartItem(key));
  const image = product.product_image || placeholderImage(product.product_name);
  const priceText = displayPriceText(product, unit);

  return `
    <article class="product-tile" data-product-id="${escapeHtml(product.product_id)}">
      <button class="tile-image-wrap" type="button" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}">
        <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      </button>
      <div class="product-body compact">
        <div class="product-title">${escapeHtml(product.product_name)}</div>
        <div class="price-wrap">
          <span class="price-main">${escapeHtml(priceText)} ج.م</span>
        </div>
        <div class="card-actions compact-actions">
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}">${inCart ? 'إزالة من السلة' : escapeHtml(actionLabel)}</button>
        </div>
      </div>
    </article>
  `;
}

function contactStripHtml() {
  return `
    <div class="contact-strip" aria-label="وسائل التواصل السريع">
      <a class="contact-icon-btn" href="tel:01040880002" aria-label="اتصال مباشر" title="اتصال مباشر">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.4 4.8 6.2 6.2l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.6.6 3.9.6.6 0 1 .4 1 1v3.3c0 .6-.4 1-1 1C10.8 20.5 3.5 13.2 3.5 4c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.4.2 2.7.6 3.9.1.4 0 .8-.3 1.1l-1.5 1.8z"/></svg>
      </a>
      <a class="contact-icon-btn" href="https://wa.me/201040880002" target="_blank" rel="noopener noreferrer" aria-label="واتساب مباشر" title="واتساب مباشر">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.9 9.9 0 0 0-8.6 14.8L2 22l5.4-1.4A10 10 0 1 0 12 2zm5.7 14.5c-.2.6-1 1-1.5 1.1-.4.1-.9.1-1.5 0-.3-.1-.7-.2-1.2-.4-2-.9-3.3-2.2-4.2-4.2-.2-.5-.3-.9-.4-1.2-.1-.6-.1-1.1 0-1.5.1-.5.5-1.3 1.1-1.5l.8-.2c.3-.1.6 0 .8.2l1 1c.2.2.3.6.2.9l-.4 1c-.1.2-.1.4 0 .6.4.8.9 1.4 1.7 1.7.2.1.4.1.6 0l1-.4c.3-.1.7 0 .9.2l1 1c.2.2.2.5.2.8l-.1.8z"/></svg>
      </a>
      <a class="contact-icon-btn" href="https://www.facebook.com/alahram2014/" target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" title="فيسبوك">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 22v-8.1h2.7l.4-3.1h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.6V4.5c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2H6.6v3.1h2.8V22h3.8z"/></svg>
      </a>
    </div>`;
}

function setOverlay(el, show) {
  el.classList.toggle('hidden', !show);
  el.setAttribute('aria-hidden', String(!show));
}

function openLogin() {
  setOverlay(els.loginModal, true);
  els.loginIdentifier.focus();
}

function closeLogin() {
  setOverlay(els.loginModal, false);
}


function openRegisterPage() {
  state.pendingReturnHash = location.hash || '#home';
  state.pendingOpenCart = !els.cartDrawer?.classList.contains('hidden');
  closeLogin();
  if (location.hash !== '#register') {
    navigate('#register');
  } else {
    renderApp();
  }
}

function closeRegisterPage() {
  const next = state.pendingReturnHash || '#home';
  state.pendingReturnHash = null;
  navigate(next);
  if (state.pendingOpenCart) {
    state.pendingOpenCart = false;
    setTimeout(openCart, 0);
  }
}

function collectRegisterForm() {
  const name = document.getElementById('registerName')?.value || '';
  const phone = document.getElementById('registerPhone')?.value || '';
  const password = document.getElementById('registerPassword')?.value || '';
  const address = document.getElementById('registerAddress')?.value || '';
  const business_name = document.getElementById('registerBusinessName')?.value || '';
  const location = document.getElementById('registerLocation')?.value || '';
  return {
    name: String(name).trim(),
    phone: String(phone).trim(),
    password: String(password).trim(),
    address: String(address).trim(),
    business_name: String(business_name).trim(),
    location: String(location).trim(),
  };
}

function validateRegister(data) {
  if (!data.name || data.name.trim().split(/\s+/).length < 2) {
    return "اكتب اسمك ثنائي على الأقل";
  }

  if (!/^01[0-9]{9}$/.test(data.phone)) {
    return "رقم الموبايل مش صحيح";
  }

  if (!data.password || data.password.length < 4) {
    return "الباسورد لازم يكون 4 أرقام أو أكتر";
  }

  if (!data.address) {
    return "اكتب العنوان";
  }

  return null;
}

async function registerCustomer() {
  const data = collectRegisterForm();
  const error = validateRegister(data);
  if (error) {
    smartToast(error);
    return;
  }

  try {
    const exists = await apiGet('customers', {
      phone: `eq.${data.phone}`,
      select: 'id',
      limit: 1,
    }).catch(() => []);

    if (exists?.length) {
      smartToast('register.duplicate', 'رقمك متسجل قبل كده');
      return;
    }

    const created = (await apiPost('customers', {
      name: data.name,
      phone: data.phone,
      password: data.password,
      address: data.address,
      location: data.location || null,
      customer_type: 'direct',
      sales_rep_id: null,
      created_by: null,
    }))[0];

    console.log('CUSTOMER CREATED:', created.id);

    state.session = {
      id: created.id,
      name: created.name,
      phone: created.phone,
      address: created.address,
      location: created.location,
      userType: 'customer',
    };

    state.invoicesLoaded = false;
    state.invoices = [];
    state.customersLoaded = false;
    state.customers = [];
    state.selectedCustomer = null;

    saveJSON(STORAGE.session, state.session);
    sessionStorage.setItem('last_msg', '');

    smartToast('register.success', 'تم إنشاء الحساب بنجاح', true);
    const nextHash = state.pendingReturnHash || '#home';
    const reopenCart = state.pendingOpenCart;
    state.pendingReturnHash = null;
    state.pendingOpenCart = false;
    navigate(nextHash);
    if (reopenCart) setTimeout(openCart, 0);
  } catch (error) {
    console.error(error);
    smartToast('errors.generic', 'تعذر إنشاء الحساب الآن', true);
  }
}

function renderMyDataContent() {
  const s = state.session || {};
  const rows = [
    ['نوع الحساب', s.userType === 'rep' ? 'مندوب' : s.userType === 'customer' ? 'عميل' : 'غير معروف'],
    ['الاسم', s.name || s.username || 'غير متاح'],
    ['رقم الهاتف', s.phone || 'غير متاح'],
    ['العنوان', s.address || s.location || 'غير متاح'],
    ['اسم المستخدم', s.username || 'غير متاح'],
  ];
  if (!els.myDataContent) return;
  els.myDataContent.innerHTML = rows.map(([label, value]) => `
    <div class="profile-item">
      <span class="profile-label">${escapeHtml(label)}</span>
      <span class="profile-value">${escapeHtml(value)}</span>
    </div>
  `).join('');
}

function openMyData() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    return;
  }
  renderMyDataContent();
  setOverlay(els.myDataModal, true);
}

function closeMyData() {
  setOverlay(els.myDataModal, false);
}

function openMyCustomers() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('هذه الصفحة للمندوب فقط');
    return;
  }
  navigate('#my-customers');
}

function closeAddCustomer() {
  setOverlay(els.addCustomerModal, false);
}

function openAddCustomer() {
  if (!state.session) {
    toast('سجّل الدخول أولًا');
    openLogin();
    return;
  }
  if (state.session.userType !== 'rep') {
    toast('إضافة العملاء متاحة للمندوب فقط');
    return;
  }
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');
  if (nameEl) nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
  if (addressEl) addressEl.value = '';
  setOverlay(els.addCustomerModal, true);
  setTimeout(() => nameEl?.focus(), 50);
}

function persistSelectedCustomer() {
  if (state.selectedCustomer) {
    saveJSON('b2b_selected_customer', state.selectedCustomer);
  } else {
    localStorage.removeItem('b2b_selected_customer');
  }
}

function selectCustomer(id) {
  const customer = state.customers.find((c) => c.id === id);
  if (!customer) return;
  state.selectedCustomer = customer;
  persistSelectedCustomer();
  closeAddCustomer();
  toast(`تم اختيار العميل: ${customer.name}`);
  navigate('#home');
}

async function loadMyCustomers() {
  if (!state.session || state.session.userType !== 'rep') {
    state.customers = [];
    state.customersLoaded = true;
    return;
  }

  const repId = state.session.id;
  const res = await apiGet('customers', {
    select: 'id,name,phone,address,username,password,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    customer_type: 'eq.rep',
    order: 'created_at.desc',
  }).catch(() => []);

  state.customers = Array.isArray(res) ? res : [];
  state.customersLoaded = true;

  if (state.selectedCustomer) {
    const exists = state.customers.some((c) => c.id === state.selectedCustomer.id);
    if (!exists) {
      state.selectedCustomer = null;
      persistSelectedCustomer();
    }
  }
}

async function saveCustomer() {
  if (!state.session || state.session.userType !== 'rep') {
    toast('هذه العملية للمندوب فقط');
    return;
  }

  const name = document.getElementById('custName')?.value.trim();
  const phone = document.getElementById('custPhone')?.value.trim();
  const address = document.getElementById('custAddress')?.value.trim();

  if (!name) {
    toast('اسم العميل مطلوب');
    return;
  }

  const payload = {
    name,
    phone: phone || null,
    address: address || null,
    customer_type: 'rep',
    created_by: state.session.id,
    sales_rep_id: state.session.id,
  };

  try {
    const created = (await apiPost('customers', payload))[0] || null;
    toast('تم إضافة العميل');
    closeAddCustomer();
    await loadMyCustomers();
    if (created?.id) {
      state.selectedCustomer = created;
      persistSelectedCustomer();
      toast(`تم اختيار العميل: ${created.name}`);
    }
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر إضافة العميل');
  }
}

function renderMyCustomersPage() {
  const repMode = state.session?.userType === 'rep';
  const selected = state.selectedCustomer;
  if (!repMode) {
    els.pageContent.innerHTML = `
      <div class="page-stack">
        <section class="section-card">
          <div class="section-head">
            <div>
              <h2>عملائي</h2>
              <div class="helper-text">هذه الصفحة متاحة للمندوب فقط</div>
            </div>
          </div>
        </section>
      </div>
    `;
    return;
  }

  const rows = state.customersLoaded ? state.customers : [];
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head customers-head">
          <div>
            <h2>عملائي</h2>
            <div class="helper-text">اختر العميل قبل بدء الطلب</div>
          </div>
          <button class="primary-btn" data-action="open-add-customer" type="button">➕ إضافة عميل</button>
        </div>
        ${selected ? `
          <div class="selected-customer">
            <span class="selected-customer-label">العميل المختار</span>
            <strong>${escapeHtml(selected.name)}</strong>
            <small>${escapeHtml(selected.phone || '')}</small>
          </div>
        ` : ''}
      </section>
      <section class="customer-list">
        ${!state.customersLoaded ? `<div class="empty-state">جاري تحميل العملاء...</div>` : rows.length ? rows.map((customer) => `
          <article class="customer-card" data-action="select-customer" data-customer-id="${escapeHtml(customer.id)}">
            <div class="customer-card-top">
              <div>
                <h3 class="customer-name">${escapeHtml(customer.name)}</h3>
                <div class="customer-meta">${escapeHtml(customer.phone || 'بدون هاتف')}</div>
              </div>
              ${selected && selected.id === customer.id ? '<span class="badge">مختار</span>' : ''}
            </div>
            <div class="customer-address">${escapeHtml(customer.address || 'بدون عنوان')}</div>
          </article>
        `).join('') : `<div class="empty-state">لا توجد عملاء مرتبطة بهذا المندوب</div>`}
      </section>
    </div>
  `;
}

function openCart() {
  els.cartDrawer.classList.remove('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
}

function closeCart() {
  els.cartDrawer.classList.add('hidden');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
}

function toggleUserMenu(force) {
  const next = typeof force === 'boolean' ? force : els.userMenu.classList.contains('hidden');
  els.userMenu.classList.toggle('hidden', !next);
  els.userMenu.setAttribute('aria-hidden', String(!next));
}

function getSessionLabel() {
  if (!state.session) return 'تسجيل الدخول';
  return state.session.name || state.session.username || state.session.phone || 'مستخدم';
}

function cartKey(item) {
  return `${item.type}:${item.id}:${item.unit || 'single'}`;
}

function findCartItem(key) {
  return state.cart.find((item) => item.key === key);
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
}

function getProductQty(productId) {
  const value = Number(state.productQtyPrefs?.[productId] || 1);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
}

function setProductQty(productId, qty) {
  const next = Math.max(1, Math.floor(Number(qty || 1)));
  state.productQtyPrefs[productId] = next;
  saveJSON(STORAGE.productQtyPrefs, state.productQtyPrefs);
  return next;
}

function resetCheckoutStage() {
  state.checkoutStage = 'validate';
  if (els.checkoutBtn) els.checkoutBtn.textContent = 'التحقق من الطلب';
}

function syncCheckoutButton() {
  if (!els.checkoutBtn) return;
  els.checkoutBtn.textContent = state.checkoutStage === 'submit' ? 'إرسال الطلب' : 'التحقق من الطلب';
}

function resolveProductPrice(product, unit) {
  const productId = String(product?.product_id || '').trim();
  const tierMapPrice = Number(state.tierPrices?.[unit]?.get(productId) || 0);
  if (Number.isFinite(tierMapPrice) && tierMapPrice > 0) return tierMapPrice;

  const tierPrice = tierUnitPrice(product, unit);
  if (tierPrice !== null && tierPrice > 0) return Number(tierPrice);

  return baseUnitPrice(product, unit);
}

function syncCartPricesFromCurrentState() {
  let changed = false;
  state.cart = state.cart.map((item) => {
    if (item.type !== 'product') return item;
    const product = state.products.find((row) => row.product_id === item.id);
    if (!product) return item;
    const price = resolveProductPrice(product, item.unit);
    const unitLabel = item.unit === 'carton' ? 'كرتونة' : 'دستة';
    if (Math.abs(Number(item.price || 0) - Number(price || 0)) > 0.0001 || item.unitLabel !== unitLabel) {
      changed = true;
      return { ...item, price, unitLabel };
    }
    return item;
  });
  if (changed) persistCart();
}

function persistCart() {
  saveJSON(STORAGE.cart, state.cart);
}

function setSearchBarHtml(html = '') {
  if (els.searchBar) els.searchBar.innerHTML = html;
}

function updateHeader() {
  const tierLabel = getSelectedTierLabel();
  if (els.tierBtn) {
    const tierText = state.selectedTier ? tierLabel : 'أختار شريحتك';
    els.tierBtn.textContent = tierText;
    els.tierBtn.title = `${tierLabel} · أختار شريحتك`;
    els.tierBtn.setAttribute('aria-label', tierText);
  }
  if (els.userBtn) els.userBtn.textContent = getSessionLabel();
  if (els.cartLabel) els.cartLabel.textContent = 'السلة';
  if (els.cartValue) els.cartValue.textContent = integer(cartTotal());
  updateFlashHeader();
  syncCheckoutButton();
}

function updateFlashHeader() {
  const flashState = getFlashState();
  const isActive = flashState.status === 'active' && Boolean(flashState.offer);

  if (els.flashBtnText) els.flashBtnText.textContent = 'عرض الساعة';

  if (els.flashBtn) {
    els.flashBtn.classList.toggle('status-active', isActive);
    els.flashBtn.classList.toggle('status-danger', flashState.status === 'expired' && Boolean(flashState.offer));
    els.flashBtn.classList.toggle('is-live', isActive);
    els.flashBtn.classList.toggle('is-idle', !isActive);
  }

  if (els.flashCountdownCapsule) {
    els.flashCountdownCapsule.classList.toggle('hidden', !isActive);
    els.flashCountdownCapsule.classList.toggle('is-live', isActive);
  }

  if (els.flashCountdownValue) {
    els.flashCountdownValue.textContent = isActive ? flashState.remaining : '';
  }
}

function getSelectedTierObject() {
  if (!state.selectedTier) return null;
  if (typeof state.selectedTier === 'string') {
    return state.tiers.find((tier) => tier.tier_name === state.selectedTier) || { tier_name: state.selectedTier };
  }
  return state.selectedTier;
}

function getSelectedTierLabel() {
  const tier = getSelectedTierObject();
  if (!tier) return 'الشريحة الرئيسية';
  return tierDisplayLabel(tier);
}

function tierDisplayLabel(tier) {
  const raw = String(tier?.visible_label || tier?.tier_name || 'الشريحة الرئيسية').trim();
  if (!raw) return 'الشريحة الرئيسية';
  return raw.toLowerCase() === 'base' ? 'الشريحة الرئيسية' : raw;
}

function tierName() {
  const tier = getSelectedTierObject();
  return tier?.tier_name || null;
}

function settingValue(key, fallback = '') {
  return state.settingMap.get(key) ?? fallback;
}

function pickSetting(keys, fallback = '') {
  for (const key of keys) {
    const value = state.settingMap.get(key);
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
}

function appBannerImage() {
  return pickSetting(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
}

function visibleHomeSettings() {
  const hidden = new Set(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
  return state.settings.filter((row) => row.key && !hidden.has(row.key)).slice(0, 6);
}

function companyName(companyId) {
  return state.companyMap.get(companyId)?.company_name || companyId || '';
}

function currentUnitForProduct(product) {
  const saved = state.unitPrefs[product.product_id];
  const available = availableUnits(product);
  if (saved && available.includes(saved)) return saved;
  if (available.includes('carton')) return 'carton';
  if (available.includes('pack')) return 'pack';
  return 'carton';
}

function availableUnits(product) {
  const units = [];
  if (product.has_carton || Number(product.carton_price) > 0) units.push('carton');
  if (product.has_pack || Number(product.pack_price) > 0) units.push('pack');
  return units;
}

function baseUnitPrice(product, unit) {
  if (unit === 'pack') return Number(product.pack_price || 0);
  return Number(product.carton_price || 0);
}

function tierUnitPrice(product, unit) {
  const tier = getSelectedTierObject();
  if (!tier) return null;

  const discount = Number(tier.discount_percent || 0);
  if (!discount || discount <= 0) return null;
  if (product.allow_discount === false) return null;

  const base = baseUnitPrice(product, unit);
  if (!base || base <= 0) return null;

  const finalPrice = base * (1 - discount / 100);
  return Number(finalPrice.toFixed(2));
}

function displayPriceBlock(product, unit) {
  const base = baseUnitPrice(product, unit);
  const discounted = tierUnitPrice(product, unit);
  const unitLabel = unit === 'carton' ? 'كرتونة' : 'دستة';

  if (discounted !== null && discounted < base) {
    return `
      <div class="price-wrap">
        <span class="price-old">${num(base)} ج.م</span>
        <span class="price-new">${num(discounted)} ج.م</span>
        <span class="product-sub">${unitLabel}</span>
      </div>
    `;
  }

  return `
    <div class="price-wrap">
      <span class="price-main">${num(base)} ج.م</span>
      <span class="product-sub">${unitLabel}</span>
    </div>
  `;
}


function displayPriceText(product, unit) {
  const price = resolveProductPrice(product, unit);
  return num(price);
}

function activeFlashOffer() {
  return state.flashOffers.find((offer) => offer.status === 'active' || offer.can_buy) || null;
}

function getFlashState() {
  const offer = state.flashOffers[0] || null;
  const active = activeFlashOffer();
  const current = active || offer;
  if (!current) return { offer: null, status: null, remaining: '', endedAt: '' };

  if (current.status === 'active' || current.can_buy) {
    return {
      offer: current,
      status: 'active',
      remaining: countdownTo(current.end_time),
      endedAt: formatDateTime(current.end_time),
    };
  }

  if (current.status === 'expired') {
    return {
      offer: current,
      status: 'expired',
      remaining: '',
      endedAt: formatDateTime(current.end_time),
    };
  }

  return {
    offer: current,
    status: 'pending',
    remaining: countdownTo(current.start_time),
    endedAt: formatDateTime(current.start_time),
  };
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function countdownTo(value) {
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return '';
  let diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}ي ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const STATUS_MAP = {
  draft: 'مسودة',
  pending: 'قيد التنفيذ',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  paid: 'مدفوع',
  submitted: 'تم الإرسال',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
};

function getStatusLabel(status) {
  return STATUS_MAP[String(status || '').trim()] || String(status || 'غير معروف');
}

function arabicStatus(status) {
  return getStatusLabel(status);
}

async function apiGet(path, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return await res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${CONFIG.baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function apiPatch(path, body, params = {}) {
  const url = new URL(`${CONFIG.baseUrl}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: CONFIG.apiKey,
      Authorization: `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function lookupUser(table, identifier) {
  const trimmed = String(identifier || '').trim();
  const rows = await apiGet(table, {
    select: 'id,name,phone,username,password',
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const phone = await apiGet(table, { select: 'id,name,phone,username,password', phone: `eq.${trimmed}`, limit: '1' });
    if (phone?.length) return phone;
    return await apiGet(table, { select: 'id,name,phone,username,password', username: `eq.${trimmed}`, limit: '1' });
  });
  return rows?.[0] || null;
}

async function loadTierPrices(tier) {
  const tierNameValue = String(tier?.tier_name || tierName() || '').trim();
  const [cartonRows, packRows] = await Promise.all([
    fetchCollection('prices_carton', { select: 'product_id,tier_name,price,visible,id', visible: 'eq.true', order: 'product_id.asc,tier_name.asc' }, []),
    fetchCollection('prices_pack', { select: 'product_id,tier_name,price,visible', visible: 'eq.true', order: 'product_id.asc,tier_name.asc' }, []),
  ]);

  state.tierPrices = {
    carton: pickTierPrice(cartonRows, tierNameValue),
    pack: pickTierPrice(packRows, tierNameValue),
  };
  syncCartPricesFromCurrentState();
}

async function fetchCollection(path, params = {}, fallback = []) {
  try {
    const rows = await apiGet(path, params);
    return Array.isArray(rows) ? rows : fallback;
  } catch (error) {
    console.warn(`Load failed for ${path}`, error);
    return fallback;
  }
}

function pickTierPrice(rows = [], tierName = null) {
  const byProduct = new Map();
  const preferred = String(tierName || '').trim();
  for (const row of rows || []) {
    if (!row || row.visible === false) continue;
    const productId = String(row.product_id || '').trim();
    if (!productId) continue;
    const nextPrice = Number(row.price || 0);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) continue;

    const current = byProduct.get(productId);
    if (!current) {
      byProduct.set(productId, nextPrice);
      continue;
    }

    const currentTier = String(current.tier_name || '').trim();
    const rowTier = String(row.tier_name || '').trim();
    if (preferred && rowTier === preferred && currentTier !== preferred) {
      byProduct.set(productId, nextPrice);
      continue;
    }

    if (!preferred && nextPrice < current) {
      byProduct.set(productId, nextPrice);
    }
  }
  return byProduct;
}

function normalizeProductsFromTables(products = [], cartonRows = [], packRows = []) {
  const currentTier = tierName();
  const cartonPriceMap = pickTierPrice(cartonRows, currentTier);
  const packPriceMap = pickTierPrice(packRows, currentTier);

  return sortProducts((products || []).map((product) => {
    const productId = String(product.product_id || '').trim();
    const cartonPrice = Number(product.carton_price ?? cartonPriceMap.get(productId) ?? 0);
    const packPrice = Number(product.pack_price ?? packPriceMap.get(productId) ?? 0);

    return {
      ...product,
      product_id: productId,
      product_name: product.product_name || '',
      company_id: product.company_id || '',
      product_image: product.product_image || '',
      status: product.status || 'active',
      visible: product.visible !== false,
      has_carton: product.has_carton ?? cartonPrice > 0,
      has_pack: product.has_pack ?? packPrice > 0,
      carton_price: cartonPrice,
      pack_price: packPrice,
      allow_discount: product.allow_discount ?? (product.discount_carton !== false || product.discount_pack !== false),
      type: product.type || 'normal',
      discount_carton: product.discount_carton ?? true,
      discount_pack: product.discount_pack ?? true,
    };
  }));
}

async function loadInvoices() {
  if (!state.session) {
    state.invoices = [];
    state.invoicesLoaded = true;
    return;
  }
  const filterKey = state.session.userType === 'customer' ? 'customer_id' : 'user_id';
  const rows = await apiGet('orders', {
    select: 'id,order_number,created_at,total_amount,status,user_type,customer_id,user_id,updated_at',
    [filterKey]: `eq.${state.session.id}`,
    order: 'created_at.desc',
  }).catch(() => []);
  state.invoices = rows || [];
  state.invoicesLoaded = true;
}

async function loadData() {
  try {
    const tierKey = tierName();
    const [
      companies,
      viewProducts,
      dailyDealsView,
      flashOffersView,
      tiers,
      settings,
      topProductsView,
      topCompaniesView,
      rawProducts,
      cartonRows,
      packRows,
      dailyDealsRaw,
      flashOffersRaw,
      salesOrders,
      salesItems,
    ] = await Promise.all([
      fetchCollection('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_id.asc' }, []),
      fetchCollection('v_products', { select: 'product_id,product_name,product_image,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount', order: 'product_name.asc' }, []),
      fetchCollection('v_daily_deals', { select: '*', order: 'id.desc' }, []),
      fetchCollection('v_flash_offers', { select: '*', order: 'start_time.desc' }, []),
      fetchCollection('tiers', { select: 'tier_name,visible_label,min_order,discount_percent', order: 'min_order.asc' }, []),
      fetchCollection('app_settings', { select: 'key,value,updated_at', order: 'updated_at.desc' }, []),
      fetchCollection('v_top_products', { select: '*' }, []),
      fetchCollection('v_top_companies', { select: '*' }, []),
      fetchCollection('products', { select: 'product_id,product_name,company_id,product_image,status,visible,has_carton,has_pack,type,discount_carton,discount_pack', order: 'product_name.asc' }, []),
      fetchCollection('prices_carton', { select: 'product_id,tier_name,price,visible,id', visible: 'eq.true', order: 'product_id.asc,tier_name.asc' }, []),
      fetchCollection('prices_pack', { select: 'product_id,tier_name,price,visible', visible: 'eq.true', order: 'product_id.asc,tier_name.asc' }, []),
      fetchCollection('daily_deals', { select: '*', order: 'id.desc' }, []),
      fetchCollection('flash_offers', { select: '*', order: 'start_time.desc' }, []),
      fetchCollection('orders', { select: 'id,status,order_number,created_at', order: 'created_at.desc' }, []),
      fetchCollection('order_items', { select: 'order_id,product_id,type,qty,price,unit,created_at', order: 'created_at.desc' }, []),
    ]);

    const companyRows = (companies || []).length ? companies : state.companies;
    const productRows = normalizeProductsFromTables(
      (viewProducts || []).length ? viewProducts : (rawProducts || []),
      cartonRows || [],
      packRows || []
    );
    const dailyDealRows = (dailyDealsView || []).length ? dailyDealsView : dailyDealsRaw;
    const flashOfferRows = (flashOffersView || []).length ? flashOffersView : flashOffersRaw;

    state.companies = sortCompanies(companyRows || []);
    state.products = sortProducts(productRows || []);
    state.dailyDeals = Array.isArray(dailyDealRows) ? dailyDealRows : [];
    state.flashOffers = Array.isArray(flashOfferRows) ? flashOfferRows : [];
    state.tiers = (tiers || []).length ? tiers : state.tiers;
    state.settings = (settings || []).length ? settings : state.settings;
    state.settingMap = new Map((state.settings || []).map((row) => [row.key, row.value]));
    state.companyMap = new Map(state.companies.map((company) => [company.company_id, company]));

    // Prefer backend ranking from existing view; otherwise derive it from sales data.
    if ((topProductsView || []).length) {
      state.topProducts = topProductsView;
    } else {
      const approvedOrders = new Set(
        (salesOrders || [])
          .filter((order) => ['confirmed', 'processing', 'shipped', 'delivered', 'paid'].includes(String(order.status || '').trim()))
          .map((order) => String(order.id))
      );
      const productQty = new Map();
      for (const item of salesItems || []) {
        if (!approvedOrders.has(String(item.order_id))) continue;
        if (String(item.type || '').trim() !== 'product') continue;
        const productId = String(item.product_id || '').trim();
        if (!productId) continue;
        productQty.set(productId, (productQty.get(productId) || 0) + Number(item.qty || 0));
      }
      state.topProducts = [...productQty.entries()]
        .sort((a, b) => b[1] - a[1] || compareNatural(a[0], b[0]))
        .slice(0, 50)
        .map(([product_id, total_qty]) => ({ product_id, total_qty }));
    }

    if ((topCompaniesView || []).length) {
      state.topCompanies = topCompaniesView;
    } else {
      const companyQty = new Map();
      const productCompanyMap = new Map((state.products || []).map((product) => [String(product.product_id), String(product.company_id || '')]));
      const approvedOrders = new Set(
        (salesOrders || [])
          .filter((order) => ['confirmed', 'processing', 'shipped', 'delivered', 'paid'].includes(String(order.status || '').trim()))
          .map((order) => String(order.id))
      );
      for (const item of salesItems || []) {
        if (!approvedOrders.has(String(item.order_id))) continue;
        if (String(item.type || '').trim() !== 'product') continue;
        const companyId = productCompanyMap.get(String(item.product_id || '').trim());
        if (!companyId) continue;
        companyQty.set(companyId, (companyQty.get(companyId) || 0) + Number(item.qty || 0));
      }
      state.topCompanies = [...companyQty.entries()]
        .sort((a, b) => b[1] - a[1] || compareNatural(a[0], b[0]))
        .slice(0, 50)
        .map(([company_id, total_sales]) => ({ company_id, total_sales }));
    }

    if (state.selectedTier) {
      const matched = state.tiers.find((tier) => tier.tier_name === tierKey) || state.selectedTier;
      state.selectedTier = matched;
      saveJSON(STORAGE.tier, matched);
      await loadTierPrices(matched);
    } else {
      await loadTierPrices(null);
    }

    saveJSON(STORAGE.dataCache, {
      companies: state.companies,
      products: state.products,
      dailyDeals: state.dailyDeals,
      flashOffers: state.flashOffers,
      tiers: state.tiers,
      settings: state.settings,
      topProducts: state.topProducts,
      topCompanies: state.topCompanies,
    });

    await syncInvoiceSequence();
    syncCartPricesFromCurrentState();
    resetCheckoutStage();
    renderCart();
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر تحميل البيانات من قاعدة البيانات');
    renderCart();
    renderApp();
  }
}

function filteredCompanies() {

  const q = normalizeText(state.search);
  const rows = state.companies.filter((company) => {
    if (!q) return true;
    return normalizeText(company.company_name).includes(q) || normalizeText(company.company_id).includes(q);
  });
  return sortCompanies(rows);
}

function filteredProducts() {
  let items = [...state.products];
  const q = normalizeText(state.search);

  if (q) {
    items = items.filter((product) => {
      return normalizeText(product.product_name).includes(q)
        || normalizeText(product.product_id).includes(q)
        || normalizeText(companyName(product.company_id)).includes(q)
        || normalizeText(product.company_id).includes(q);
    });
  } else if (state.view.type === 'company' && state.view.companyId) {
    items = items.filter((product) => product.company_id === state.view.companyId);
  }

  return sortProducts(items);
}

function matchesHomeSearch(product, q) {
  const query = normalizeText(q || state.search);
  if (!query) return true;
  return normalizeText(product.product_name).includes(query)
    || normalizeText(product.product_id).includes(query)
    || normalizeText(companyName(product.company_id)).includes(query)
    || normalizeText(product.company_id).includes(query);
}

function matchesDealSearch(item, q) {
  const query = normalizeText(q || state.search);
  if (!query) return true;
  return normalizeText(item.title).includes(query)
    || normalizeText(item.description).includes(query)
    || normalizeText(String(item.id)).includes(query)
    || normalizeText(item.company_id).includes(query);
}

function filteredDailyDeals() {
  const q = normalizeText(state.search);
  return q ? state.dailyDeals.filter((item) => matchesDealSearch(item, q)) : state.dailyDeals;
}

function filteredFlashOffers() {
  const q = normalizeText(state.search);
  return q ? state.flashOffers.filter((item) => matchesDealSearch(item, q)) : state.flashOffers;
}

function productCardHtml(product) {
  const unit = currentUnitForProduct(product);
  const units = availableUnits(product);
  const key = cartKey({ type: 'product', id: product.product_id, unit });
  const inCart = Boolean(findCartItem(key));
  const image = product.product_image || placeholderImage(product.product_name);
  const qty = getProductQty(product.product_id);
  const unitHtml = units.length
    ? units.map((itemUnit) => `
        <button class="unit-chip ${itemUnit === unit ? 'active' : ''}" data-action="set-unit" data-product-id="${escapeHtml(product.product_id)}" data-unit="${escapeHtml(itemUnit)}">
          ${itemUnit === 'carton' ? 'كرتونة' : 'دستة'}
        </button>
      `).join('')
    : `<span class="product-sub">لا توجد وحدة</span>`;

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.product_id)}">
      <button class="product-image-wrap" type="button" data-action="open-product" data-product-id="${escapeHtml(product.product_id)}">
        <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      </button>
      <div class="product-body">
        <div class="product-topline">
          <div class="product-title">${escapeHtml(product.product_name)}</div>
        </div>
        ${displayPriceBlock(product, unit)}
        <label class="qty-pick">
          <span class="qty-label">الكمية</span>
          <input
            type="number"
            min="1"
            value="${integer(qty)}"
            class="qty-input"
            data-role="product-qty"
            data-product-id="${escapeHtml(product.product_id)}"
            inputmode="numeric"
          />
        </label>
        <div class="unit-strip">${unitHtml}</div>
        <div class="card-actions">
          <button class="primary-btn" data-action="toggle-product" data-product-id="${escapeHtml(product.product_id)}">
            ${inCart ? 'إزالة من السلة' : 'شراء'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderRegisterPage() {
  const target = els.registerPage || els.pageContent;
  if (!target) return;

  target.innerHTML = `
    <section class="register-shell">
      <div class="section-card register-card">
        <div class="register-hero">
          <h1>تسجيل عميل جديد</h1>
          <p>سجل حسابك الشخصى لتتمكن من أرسال طلبات الشراء ومتابعة كل طلباتك السابقه</p>
        </div>

        <form class="register-form" id="registerForm" autocomplete="on">
          <div class="register-grid">
            <label class="field">
              <span>الاسم الكامل</span>
              <input id="registerName" type="text" placeholder="الاسم ثنائي على الأقل" autocomplete="name" />
            </label>

            <label class="field">
              <span>رقم الموبايل</span>
              <input id="registerPhone" type="tel" placeholder="01xxxxxxxxx" inputmode="numeric" autocomplete="tel" />
            </label>

            <label class="field">
              <span>كلمة المرور</span>
              <input id="registerPassword" type="password" placeholder="4 أرقام أو أكتر" autocomplete="new-password" />
            </label>

            <label class="field">
              <span>العنوان</span>
              <input id="registerAddress" type="text" placeholder="العنوان بالتفصيل" autocomplete="street-address" />
            </label>

            <label class="field">
              <span>اسم النشاط (اختياري)</span>
              <input id="registerBusinessName" type="text" placeholder="اسم المحل أو النشاط" autocomplete="organization" />
            </label>

            <div class="field">
              <span>الموقع (اختياري)</span>
              <div class="location-row">
                <input id="registerLocation" type="text" placeholder="اضغط تحديد الموقع" autocomplete="off" />
                <button class="ghost-btn" id="registerLocateBtn" type="button">تحديد الموقع</button>
              </div>
            </div>
          </div>

          <div class="register-actions">
            <button class="primary-btn" id="registerSubmitBtn" type="submit">تحقق وسجل</button>
            <button class="ghost-btn" id="backToLoginBtn" type="button">رجوع للدخول</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderHomePage() {
  const banner = appBannerImage();
  const q = normalizeText(state.search);
  const companyRows = q ? filteredCompanies() : sortCompanies(state.companies);
  const recommended = topRecommendedProducts(8);
  const viewed = topViewedProducts(8);
  const bestSelling = topBestSellingProducts(8);
  const companion = cartCompanionProducts(8);

  const bannerHtml = banner
    ? `<img class="banner-image" src="${escapeHtml(banner)}" alt="بانر الصفحة الرئيسية" loading="eager" />`
    : `<div class="banner-fallback">اكتشف أفضل العروض الآن</div>`;

  if (els.banner) {
    els.banner.innerHTML = `
      <section class="banner-card home-hero">
        <div class="home-hero-copy">
          <h1>الاهرام للتجارة والتوزيع</h1>
          <p></p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" data-action="home-cta">تسوق الآن</button>
            <button class="ghost-btn" type="button" data-action="shelf-more" data-hash="#deals">العروض القوية</button>
          </div>
          <div class="hero-pills">
          </div>
        </div>
        <div class="home-hero-art">
          ${bannerHtml}
        </div>
      </section>
    `;
  }

  setSearchBarHtml(`
    <section class="section-card search-card">
      ${contactStripHtml()}
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث باسم المنتج أو الشركة" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" type="button">×</button>
      </div>
    </section>
  `);

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="shelf-card">
        <div class="shelf-head">
          <div>
            <h2>الشركات المتاحة</h2>
            <div class="helper-text">تشكيل متنوع من اكبر شركات مستحضرات التجميل</div>
          </div>
        </div>
        <div class="company-shelf">
          ${companyRows.length ? companyRows.map((company) => `
            <article class="company-card company-card-home" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}">
              <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
              <div class="company-name">${escapeHtml(company.company_name)}</div>
              <button class="ghost-btn company-btn" type="button">تصفح المنتجات</button>
            </article>
          `).join('') : `<div class="empty-state">لا توجد شركات ظاهرة الآن</div>`}
        </div>
      </section>

      <section id="home-recommended">
        ${renderProductShelf(
          'منتجات موصى بها لك',
          'مختارة بناءً على نشاطك',
          q ? recommended.filter((p) => matchesHomeSearch(p, q)) : recommended,
          { kind: 'recommended', moreHash: '#home', moreLabel: 'عرض الكل', badge: 'موصى به', actionLabel: 'شراء' }
        )}
      </section>

      <section>
        ${renderProductShelf(
          'الأكثر مشاهدة',
          'المنتجات الأكثر تصفحًا',
          q ? viewed.filter((p) => matchesHomeSearch(p, q)) : viewed,
          { kind: 'viewed', moreHash: '#home', moreLabel: 'عرض المزيد', badge: 'الأكثر مشاهدة', actionLabel: 'شراء' }
        )}
      </section>

      <section>
        ${renderProductShelf(
          'الأكثر مبيعًا',
          'الأعلى طلبًا من العملاء',
          q ? bestSelling.filter((p) => matchesHomeSearch(p, q)) : bestSelling,
          { kind: 'bestseller', moreHash: '#home', moreLabel: 'عرض المزيد', badge: 'الأكثر مبيعًا', actionLabel: 'شراء' }
        )}
      </section>

      <section>
        ${renderProductShelf(
          'مقترحات تناسب سلتك',
          'منتجات تكمل طلبك',
          q ? companion.filter((p) => matchesHomeSearch(p, q)) : companion,
          { kind: 'cart-match', moreHash: '#cart', moreLabel: 'عرض السلة', badge: 'مكمّل للسلة', actionLabel: 'أضف مع الطلب' }
        )}
      </section>
    </div>
  `;
}

function renderCompanyPage() {
  const title = companyName(state.view.companyId);
  const products = filteredProducts();

  setSearchBarHtml(`
    <section class="section-card search-card">
      ${contactStripHtml()}
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title || 'المنتجات')}</h2>
          <div class="helper-text">${escapeHtml(getSelectedTierLabel())}</div>
        </div>
      </div>
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث باسم المنتج أو الكود" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" type="button">×</button>
      </div>
    </section>
  `);

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="grid product-grid">
        ${products.length ? products.map(productCardHtml).join('') : `<div class="empty-state">لا توجد منتجات تطابق البحث أو الشركة المحددة</div>`}
      </section>
    </div>
  `;
}

function renderTierPage() {
  const current = tierName();
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>أختار شريحتك</h2>
            <div class="helper-text">اختر الشريحة المناسبة ثم عد إلى الصفحة الرئيسية</div>
          </div>
        </div>
      </section>
      <section class="tier-grid">
        ${state.tiers.length ? state.tiers.map((tier) => `
          <article class="tier-card">
            <div class="bad-line">
              <div>
                <div class="tier-name">${escapeHtml(tierDisplayLabel(tier))}</div>
                <div class="tier-visible">${escapeHtml(tierDisplayLabel(tier))}</div>
              </div>
              <span class="badge">${num(tier.discount_percent || 0)}%</span>
            </div>
            <div class="tier-min">الحد الأدنى: ${num(tier.min_order || 0)}</div>
            <button class="primary-btn" data-action="select-tier" data-tier-name="${escapeHtml(tier.tier_name)}" data-visible-label="${escapeHtml(tierDisplayLabel(tier))}">
              ${current === tier.tier_name ? 'خروج' : 'اختيار'}
            </button>
          </article>
        `).join('') : `<div class="empty-state">لا توجد شرائح معرفة</div>`}
      </section>
    </div>
  `;
}

function renderDealsPage() {
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>صفقة اليوم</h2>
            <div class="helper-text">صفقة اليوم فرص لا تتكرر</div>
          </div>
        </div>
      </section>
      <section class="deal-list">
        ${filteredDailyDeals().length ? filteredDailyDeals().map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
      </section>
    </div>
  `;
}

function renderFlashPage() {
  const flashState = getFlashState();
  const active = flashState.status === 'active' ? flashState.offer : null;
  const heroTitle = flashState.status === 'active'
    ? 'متبقي من الوقت على انتهاء العرض'
    : flashState.status === 'expired'
      ? 'انتهى العرض'
      : 'العرض قادم قريبًا';
  const heroNote = flashState.status === 'active'
    ? 'شروط العرض الدفع مقدما قبل انتهاء الوقت'
    : flashState.status === 'expired'
      ? `تاريخ الانتهاء: ${flashState.endedAt}`
      : `يبدأ في: ${flashState.endedAt}`;
  const heroCountdown = flashState.status === 'active'
    ? flashState.remaining
    : flashState.status === 'expired'
      ? flashState.endedAt
      : flashState.remaining || '';

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="flash-hero">
        <div class="flash-copy">${escapeHtml(heroTitle)}</div>
        <div class="flash-countdown mono">${escapeHtml(heroCountdown || '--:--:--')}</div>
        <div class="flash-note">${escapeHtml(heroNote)}</div>
      </section>
      <section class="deal-list">
        ${filteredFlashOffers().length ? filteredFlashOffers().map((offer) => dealCardHtml(offer, 'flash', active)).join('') : `<div class="empty-state">لا توجد عروض الساعة</div>`}
      </section>
    </div>
  `;
}

function renderInvoicesPage() {
  const rows = state.invoices;
  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>فواتيري</h2>
            <div class="helper-text">رقم الطلب، التاريخ، القيمة، والحالة</div>
          </div>
          <button class="ghost-btn" data-action="refresh-invoices" type="button">تحديث</button>
        </div>
      </section>
      <section class="invoice-list">
        ${!state.session ? `<div class="empty-state">سجّل الدخول لعرض الفواتير</div>` : rows.length ? rows.map(renderInvoiceCard).join('') : `<div class="empty-state">لا توجد فواتير مرتبطة بهذا الحساب</div>`}
      </section>
    </div>
  `;
}

function renderInvoiceCard(order) {
  return `
    <article class="invoice-card">
      <div class="invoice-top">
        <div>
          <div class="invoice-number">${escapeHtml(order.order_number)}</div>
          <div class="invoice-meta">
            <span>${escapeHtml(formatDateTime(order.created_at))}</span>
            <span>الحالة: ${escapeHtml(getStatusLabel(order.status))}</span>
          </div>
        </div>
        <span class="invoice-amount mono">${num(order.total_amount)} </span>
      </div>
      <div class="bad-line">
        <span class="status-pill">${escapeHtml(order.user_type || '')}</span>
        <span class="status-pill ${statusClass(order.status)}">${escapeHtml(getStatusLabel(order.status))}</span>
      </div>
    </article>
  `;
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'paid', 'completed'].includes(value)) return 'status-active';
  if (['cancelled', 'rejected'].includes(value)) return 'status-danger';
  return 'status-muted';
}

function renderSearchablePageWrapper(title, subtitle) {
  return `
    <section class="section-card">
      <div class="section-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<div class="helper-text">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" type="button">×</button>
      </div>
    </section>
  `;
}

function dealCardHtml(item, type, activeFlash = null) {
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.description || '');
  const image = escapeHtml(item.image || placeholderImage(item.title));
  const price = num(item.price);
  const key = `${type}:${item.id}:single`;
  const inCart = Boolean(findCartItem(key));
  const canBuy = type === 'deal' ? Boolean(item.can_buy) : Boolean(item.can_buy);
  const status = type === 'flash'
    ? (item.status === 'active' ? 'نشط الآن' : item.status === 'pending' ? 'قريبًا' : 'منتهي')
    : (item.can_buy ? 'متاح' : 'غير متاح');
  const buttonText = !canBuy
    ? 'انتهى العرض'
    : inCart
      ? 'إزالة من السلة'
      : (type === 'deal' ? 'شراء الآن' : 'شراء الآن');
  const buttonDisabled = !canBuy;
  const metaLine = type === 'flash'
    ? (item.status === 'active' ? `متبقي: ${countdownTo(item.end_time)}` : item.status === 'expired' ? `انتهى: ${formatDateTime(item.end_time)}` : `يبدأ: ${formatDateTime(item.start_time)}`)
    : `المخزون: ${integer(item.stock || 0)}`;

  return `
    <article class="deal-card">
      <button class="deal-image-wrap" type="button" data-action="open-offer" data-offer-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">
        <img class="deal-image" src="${image}" alt="${title}" loading="lazy" />
      </button>
      <div class="deal-body">
        <div class="badge-row">
          <span class="badge">${escapeHtml(status)}</span>
          <span class="badge">${escapeHtml(metaLine)}</span>
        </div>
        <h3 class="deal-title">${title}</h3>
        <p class="deal-desc">${desc}</p>
        <div class="price-wrap">
          <span class="price-main">${price} ج.م</span>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-action="${type === 'deal' ? 'toggle-deal' : 'toggle-flash'}" data-id="${escapeHtml(item.id)}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
          <button class="ghost-btn" type="button" data-action="open-offer" data-offer-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">تفاصيل</button>
        </div>
      </div>
    </article>
  `;
}


function renderApp() {
  const active = document.activeElement;
  const preserveSearch = active && active.id === 'searchInput' ? { start: active.selectionStart, end: active.selectionEnd } : null;
  updateHeader();
  state.view = parseHash();
  const isRegister = state.view.type === 'register';

  if (els.mainHeader) els.mainHeader.classList.toggle('hidden', isRegister);
  if (els.banner) els.banner.classList.toggle('hidden', isRegister);
  if (els.searchBar) els.searchBar.classList.toggle('hidden', isRegister);
  if (els.pageContent) els.pageContent.classList.toggle('hidden', isRegister);
  if (els.registerPage) els.registerPage.classList.toggle('hidden', !isRegister);

  if (els.searchBar) els.searchBar.innerHTML = '';

  if (isRegister) {
    renderRegisterPage();
    setTimeout(() => document.getElementById('registerName')?.focus(), 50);
  } else if (state.view.type === 'home') {
    renderHomePage();
  } else if (state.view.type === 'company') {
    renderCompanyPage();
  } else if (state.view.type === 'tiers') {
    renderTierPage();
  } else if (state.view.type === 'deals') {
    renderDealsPage();
  } else if (state.view.type === 'flash') {
    renderFlashPage();
  } else if (state.view.type === 'invoices') {
    renderInvoicesPage();
  } else if (state.view.type === 'my-customers') {
    renderMyCustomersPage();
  } else {
    renderHomePage();
  }

  wirePageEvents();

  if (preserveSearch) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(preserveSearch.start ?? input.value.length, preserveSearch.end ?? input.value.length);
      } catch {}
    }
  }
}

function wirePageEvents() {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderApp();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      state.search = '';
      renderApp();
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      registerCustomer();
    });
  }

  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener('click', registerCustomer);
  }

  const registerLocateBtn = document.getElementById('registerLocateBtn');
  if (registerLocateBtn) {
    registerLocateBtn.addEventListener('click', () => {
      const locationInput = document.getElementById('registerLocation');
      if (!navigator.geolocation) {
        toast('الموقع غير مدعوم على الجهاز');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const value = `https://maps.google.com/?q=${latitude},${longitude}`;
          if (locationInput) locationInput.value = value;
          toast('تم تحديد الموقع');
        },
        () => {
          toast('تعذر تحديد الموقع');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  const backToLoginBtn = document.getElementById('backToLoginBtn');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => {
      navigate('#home');
      openLogin();
    });
  }
}

function setSearch(value) {
  state.search = String(value || '');
  if (state.search.length >= 2) recordUiEvent('search.query', { query: state.search.slice(0, 64) });
  renderApp();
}

function setSelectedTier(tier, persist = true) {
  state.selectedTier = tier;
  if (persist) saveJSON(STORAGE.tier, tier);
}

async function handleSelectTier(tier) {
  const current = tierName();
  if (current === tier.tier_name) {
    recordUiEvent('tier.clear', { tierName: tier.tier_name });
    state.selectedTier = null;
    saveJSON(STORAGE.tier, null);
    state.tierPrices = { carton: new Map(), pack: new Map() };
    resetCheckoutStage();
    syncCartPricesFromCurrentState();
    renderCart();
    renderApp();
    navigate('#home');
    smartToast('tier.missing', 'تم الخروج من الشريحة', true);
    return;
  }
  setSelectedTier(tier, true);
  recordUiEvent('tier.select', { tierName: tier.tier_name, visibleLabel: tier.visible_label || tier.tier_name });
  await loadTierPrices(tier);
  resetCheckoutStage();
  syncCartPricesFromCurrentState();
  renderCart();
  renderApp();
  navigate('#home');
  smartToast('tier.selected', `تم اختيار ${tierDisplayLabel(tier)}`, true);
}

function toggleProductFromCard(productId) {
  const product = state.products.find((item) => item.product_id === productId);
  if (!product) return;
  const card = document.querySelector(`.product-card[data-product-id="${CSS.escape(productId)}"]`);
  const unit = card?.querySelector('.unit-chip.active')?.getAttribute('data-unit') || currentUnitForProduct(product);
  const qtyInput = card?.querySelector('.qty-input');
  const qty = setProductQty(productId, qtyInput ? qtyInput.value : getProductQty(productId));
  const key = cartKey({ type: 'product', id: productId, unit });
  const existing = findCartItem(key);
  if (existing) {
    state.cart = state.cart.filter((item) => item.key !== key);
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    state.behavior.lastCartActivity = Date.now();
    recordUiEvent('cart.remove', { productId, unit, qty, companyId: product.company_id });
    smartToast('cart.remove', 'تمت الإزالة من السلة', true);
    return;
  }

  const price = resolveProductPrice(product, unit);
  state.cart.push({
    key,
    type: 'product',
    id: productId,
    title: product.product_name,
    image: product.product_image || placeholderImage(product.product_name),
    company: companyName(product.company_id),
    unit,
    unitLabel: unit === 'carton' ? 'كرتونة' : 'دستة',
    price,
    qty,
  });
  persistCart();
  resetCheckoutStage();
  renderCart();
  renderApp();
  state.behavior.lastCartActivity = Date.now();
  recordUiEvent('cart.add', { productId, unit, qty, companyId: product.company_id });
  smartToast('cart.add', 'تمت الإضافة للسلة', true);
}

function toggleDeal(type, id) {
  const source = type === 'deal' ? state.dailyDeals : state.flashOffers;
  const item = source.find((row) => String(row.id) === String(id));
  if (!item) return;
  if (type === 'deal' && !item.can_buy) return toast('صفقة اليوم غير متاحة');
  if (type === 'flash' && !item.can_buy) return toast('العرض غير متاح');

  const key = `${type}:${item.id}:single`;
  const existing = findCartItem(key);
  if (existing) {
    state.cart = state.cart.filter((row) => row.key !== key);
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    state.behavior.lastCartActivity = Date.now();
    recordUiEvent('cart.remove', { offerId: item.id, offerType: type });
    smartToast('cart.remove', 'تمت الإزالة من السلة', true);
    return;
  }

  state.cart.push({
    key,
    type,
    id: item.id,
    title: item.title,
    image: item.image || placeholderImage(item.title),
    company: type === 'deal' ? 'صفقة اليوم' : 'عرض الساعة',
    unit: 'single',
    unitLabel: 'دستة',
    price: Number(item.price || 0),
    qty: 1,
  });
  persistCart();
  resetCheckoutStage();
  renderCart();
  renderApp();
  state.behavior.lastCartActivity = Date.now();
  recordUiEvent('cart.add', { offerId: item.id, offerType: type });
  smartToast('cart.add', 'تمت الإضافة للسلة', true);
}


function renderCart() {
  if (!state.cart.length) {
    els.cartItems.innerHTML = '<div class="empty-state">السلة فارغة الآن</div>';
    els.cartTotal.textContent = integer(cartTotal());
    syncCheckoutButton();
    updateHeader();
    return;
  }

  els.cartItems.innerHTML = state.cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <div>
        <h4 class="cart-title">${escapeHtml(item.title)}</h4>
        <div class="cart-meta">${escapeHtml(item.company || '')}</div>
        <div class="cart-price">${escapeHtml(item.unitLabel || item.unit || '')} · ${num(item.price)} ج.م</div>
        ${item.unit === 'single' ? `
          <div class="qty-row single-item-row">
            <button class="ghost-btn" data-action="remove-item" data-key="${escapeHtml(item.key)}" type="button">إزالة</button>
          </div>
        ` : `
          <div class="qty-row">
            <button data-action="qty-down" data-key="${escapeHtml(item.key)}" type="button">-</button>
            <input data-role="cart-qty" data-key="${escapeHtml(item.key)}" type="number" min="1" value="${integer(item.qty || 1)}" inputmode="numeric" />
            <button data-action="qty-up" data-key="${escapeHtml(item.key)}" type="button">+</button>
            <button class="ghost-btn" data-action="remove-item" data-key="${escapeHtml(item.key)}" type="button">حذف</button>
          </div>
        `}
      </div>
    </div>
  `).join('');

  els.cartTotal.textContent = integer(cartTotal());
  syncCheckoutButton();
  updateHeader();
}

function setCartQty(key, qty) {
  const item = state.cart.find((row) => row.key === key);
  if (!item) return;
  item.qty = Math.max(1, Number(qty || 1));
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((row) => row.key !== key);
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}

function qtyAdjust(key, delta) {
  const item = state.cart.find((row) => row.key === key);
  if (!item) return;
  item.qty = Math.max(1, Number(item.qty || 1) + delta);
  persistCart();
  resetCheckoutStage();
  state.behavior.lastCartActivity = Date.now();
  renderCart();
  renderApp();
}

async function getLiveCheckoutSnapshot() {
  const productItems = state.cart.filter((item) => item.type === 'product');
  const ids = [...new Set(productItems.map((item) => String(item.id)))];
  const tier = getSelectedTierObject();
  const tierKey = tier?.tier_name || null;
  const [freshProducts, freshTier] = await Promise.all([
    ids.length ? apiGet('v_products', {
      select: 'product_id,product_name,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount',
      product_id: `in.(${ids.join(',')})`,
    }).catch(() => []) : Promise.resolve([]),
    tierKey ? apiGet('tiers', { select: 'tier_name,min_order,visible_label,discount_percent', tier_name: `eq.${tierKey}`, limit: '1' }).catch(() => []) : Promise.resolve([]),
  ]);

  const productsMap = new Map((freshProducts || []).map((row) => [String(row.product_id), row]));
  const tierRow = Array.isArray(freshTier) ? freshTier[0] : freshTier?.[0];

  return { productsMap, tierRow };
}

async function validateCartAgainstDatabase() {
  if (!state.cart.length) {
    return { ok: false, message: 'السلة فارغة' };
  }

  const snapshot = await getLiveCheckoutSnapshot();
  for (const item of state.cart) {
    if (item.type !== 'product') continue;
    const product = snapshot.productsMap.get(String(item.id));
    if (!product) {
      return { ok: false, message: `المنتج ${item.title} غير موجود الآن` };
    }

    const liveBase = item.unit === 'pack'
      ? Number(product.pack_price || 0)
      : Number(product.carton_price || 0);
    const liveDiscount = snapshot.tierRow && product.allow_discount !== false
      ? Number(snapshot.tierRow.discount_percent || 0)
      : 0;
    const livePrice = liveDiscount > 0 && liveBase > 0
      ? Number((liveBase * (1 - liveDiscount / 100)).toFixed(2))
      : liveBase;

    if (Math.abs(Number(item.price || 0) - livePrice) > 0.0001) {
      return {
        ok: false,
        message: `سعر ${item.title} تغيّر. أعد إضافة المنتج من جديد`,
      };
    }
  }

  if (snapshot.tierRow && Number(cartTotal()) < Number(snapshot.tierRow.min_order || 0)) {
    const remaining = Number(snapshot.tierRow.min_order || 0) - Number(cartTotal());
    return {
      ok: false,
      message: `متبقي لك ${num(remaining)} للوصول إلى الشريحة`,
    };
  }

  return { ok: true, snapshot };
}

function validateBeforeOrder() {
  if (!state.session) {
    state.pendingReturnHash = location.hash || '#home';
    state.pendingOpenCart = !els.cartDrawer?.classList.contains('hidden');
    smartToast('login.missing', 'يجب إنشاء حساب أولاً لإتمام الطلب', true);
    openRegisterPage();
    return false;
  }

  if (state.session.userType === 'rep' && !state.selectedCustomer) {
    smartToast('checkout.missing', 'يجب اختيار عميل قبل إرسال الطلب', true);
    navigate('#my-customers');
    return false;
  }

  if (!state.cart.length) {
    smartToast('cart.empty', 'السلة فارغة', true);
    return false;
  }

  const tier = getSelectedTierObject();
  if (!tier) {
    smartToast('tier.missing', 'يرجى اختيار الشريحة المناسبة', true);
    return false;
  }

  const total = cartTotal();
  if (total < Number(tier.min_order || 0)) {
    const diff = Number(tier.min_order || 0) - total;
    smartToast('tier.incomplete', `فاضل ${num(diff)} جنيه وتكمل الشريحة`, true);
    return false;
  }

  return true;
}

async function buildOrderPayload(orderNumber) {
  const isRep = state.session.userType === 'rep';
  const repCustomer = isRep ? state.selectedCustomer : null;
  return {
    order_number: String(orderNumber),
    user_type: state.session.userType,
    customer_id: isRep ? repCustomer?.id || null : state.session.id,
    sales_rep_id: isRep ? state.session.id : null,
    user_id: isRep ? state.session.id : null,
    total_amount: Number(cartTotal().toFixed(2)),
    products_total: Number(state.cart.filter((item) => item.type === 'product').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
    deals_total: Number(state.cart.filter((item) => item.type === 'deal').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
    flash_total: Number(state.cart.filter((item) => item.type === 'flash').reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0).toFixed(2)),
    status: 'pending',
  };
}

async function createOrder() {
  const orderNumber = await reserveInvoiceNumber();
  const payload = await buildOrderPayload(orderNumber);
  const res = await apiPost('orders', payload);
  if (!res || !res[0]) throw new Error('Order creation failed');
  return res[0];
}

async function insertOrderItems(orderId) {
  const items = state.cart.map((item) => ({
    order_id: orderId,
    product_id: String(item.id),
    qty: Number(item.qty || 1),
    price: Number(item.price || 0),
    unit: item.unit === 'carton' ? 'carton' : item.unit === 'pack' ? 'pack' : 'piece',
    type: item.type === 'deal' ? 'deal' : item.type === 'flash' ? 'flash' : 'product',
  }));
  if (!items.length) return;
  await apiPost('order_items', items);
}

function buildWhatsAppInvoice(order, items) {

  let repBlock = '';
  let customerBlock = '';

  // 🟢 حالة المندوب
  if (state.session.userType === 'rep') {

    const rep = state.session;
    const customer = state.selectedCustomer;

    repBlock = `
👨‍💼 المندوب
${rep.name || ''}
📞 ${rep.phone || ''}
📍 ${rep.address || rep.location || ''}
━━━━━━━━━━━━━━
`;

    customerBlock = `
👤 العميل
${customer?.name || ''}
📞 ${customer?.phone || ''}
📍 ${customer?.address || customer?.location || ''}
`;

  } else {

    // 🔵 عميل مباشر
    const customer = state.session;

    customerBlock = `
👤 العميل
${customer.name || ''}
📞 ${customer.phone || ''}
📍 ${customer.address || customer.location || ''}
`;
  }

  let message = `🧾 فاتورة طلب شراء
رقم الفاتورة: ${order.order_number}

━━━━━━━━━━━━━━
${repBlock}${customerBlock}

━━━━━━━━━━━━━━
📊 الشريحة
${getSelectedTierLabel()}
━━━━━━━━━━━━━━
📦 تفاصيل الطلب
`;

  items.forEach((i) => {
    const unitLabel =
      i.unit === 'carton' ? 'كرتونة' :
      i.unit === 'pack' ? 'دستة' :
      'قطعة';

    message += `
📦 ${i.title || i.name || ''}
كود: ${i.id}
الوحدة: ${unitLabel}
سعر الوحدة: ${num(i.price)} جنيه
الكمية: ${i.qty}
الإجمالي: ${num(Number(i.qty || 0) * Number(i.price || 0))} جنيه

━━━━━━━━━━━━━━
`;
  });

  message += `
💰 إجمالي الفاتورة:
${num(order.total_amount)} جنيه
━━━━━━━━━━━━━━
`;

  return encodeURIComponent(message);
}

function sendToWhatsApp(order, items) {
  const phone = CONFIG.supportWhatsapp;
  const text = buildWhatsAppInvoice(order, items);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function handleCheckout() {
  if (!validateBeforeOrder()) return;

  try {
    const order = await createOrder();
    console.log('ORDER CREATED:', order.id);
    await insertOrderItems(order.id);
    sendToWhatsApp(order, state.cart);

    recordUiEvent('checkout.submit', { orderId: order.id, orderNumber: order.order_number, total: Number(cartTotal().toFixed(2)) });
    smartToast('success.order', 'تم إرسال الطلب بنجاح', true);

    state.cart = [];
    persistCart();
    resetCheckoutStage();
    renderCart();
    renderApp();
    closeCart();
  } catch (e) {
    console.error(e);
    resetCheckoutStage();
    syncCheckoutButton();
    toast('فشل إرسال الطلب');
  }
}

function checkout() {
  return handleCheckout();
}

async function handleLogin() {

  const identifier = els.loginIdentifier.value.trim();
  const password = els.loginPassword.value.trim();
  if (!identifier || !password) {
    toast('أدخل البيانات كاملة');
    return;
  }

  try {
    let user = await lookupUser('customers', identifier);
    let userType = 'customer';
    if (!user) {
      user = await lookupUser('sales_reps', identifier);
      userType = 'rep';
    }
    if (!user) {
      smartToast('login.error', 'المستخدم غير موجود', true);
      return;
    }
    if (String(user.password || '').trim() !== password) {
      smartToast('login.error', 'كلمة المرور غير صحيحة', true);
      return;
    }

    state.session = { ...user, userType };
    recordUiEvent('login.success', { userId: user.id, userType });
    state.invoicesLoaded = false;
    state.invoices = [];
    state.customersLoaded = false;
    state.customers = [];
    state.selectedCustomer = null;
    persistSelectedCustomer();
    saveJSON(STORAGE.session, state.session);
    closeLogin();
    updateHeader();
    renderApp();
    smartToast('login.success', `مرحبًا ${getSessionLabel()}`, true);
  } catch (error) {
    console.error(error);
    toast('تعذر تسجيل الدخول الآن');
  }
}

function logout() {
  recordUiEvent('logout', { userId: state.session?.id || null, userType: state.session?.userType || null });
  state.session = null;
  state.invoicesLoaded = false;
  state.invoices = [];
  state.customersLoaded = false;
  state.customers = [];
  state.selectedCustomer = null;
  persistSelectedCustomer();
  saveJSON(STORAGE.session, null);
  toggleUserMenu(false);
  resetCheckoutStage();
  updateHeader();
  renderApp();
  toast('تم تسجيل الخروج');
}

async function handleRoute() {
  state.view = parseHash();
  recordUiEvent('route.change', { page: state.view.type, companyId: state.view.companyId || null });

  if (state.view.type === 'home') {
    recordUiEvent('page.view', { page: 'home' });
  }
  if (state.view.type === 'company' && state.view.companyId) {
    recordUiEvent('company.view', { companyId: state.view.companyId });
  }
  if (state.view.type === 'deals') {
    state.behavior.visitedDeals = true;
  }
  if (state.view.type === 'flash') {
    state.behavior.visitedFlash = true;
  }
  if (state.view.type === 'invoices' && !state.invoicesLoaded) {
    await loadInvoices();
  }
  if (state.view.type === 'my-customers' && !state.customersLoaded) {
    await loadMyCustomers();
  }
  renderApp();
}

function syncUnitPreference(productId, unit) {
  state.unitPrefs[productId] = unit;
  saveJSON(STORAGE.unitPrefs, state.unitPrefs);
}

function wireGlobalEvents() {
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action], [data-close], [data-company-id]');
    if (!target) return;

    const closeTarget = target.getAttribute('data-close');
    if (closeTarget === 'loginModal') return closeLogin();
    if (closeTarget === 'myDataModal') return closeMyData();
    if (closeTarget === 'addCustomerModal') return closeAddCustomer();
    if (closeTarget === 'productModal') return closeProductModal();
    if (closeTarget === 'cartDrawer') return closeCart();
    if (closeTarget === 'registerPage') return closeRegisterPage();

    const action = target.getAttribute('data-action');
    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      recordUiEvent('company.click', { companyId });
      navigate(`#company/${encodeURIComponent(companyId)}`);
      return;
    }
    if (action === 'home-cta') {
      navigate('#home');
      setTimeout(() => document.getElementById('home-recommended')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      return;
    }
    if (action === 'shelf-more') {
      const hash = target.getAttribute('data-hash') || '#home';
      if (hash === '#cart') {
        openCart();
      } else {
        navigate(hash);
      }
      return;
    }
    if (action === 'cart') return openCart();
    if (action === 'my-data') return openMyData();
    if (action === 'my-customers') {
      toggleUserMenu(false);
      return openMyCustomers();
    }
    if (action === 'open-add-customer') return openAddCustomer();
    if (action === 'save-customer') return saveCustomer();
    if (action === 'open-register') return openRegisterPage();
    if (action === 'register-submit') return registerCustomer();
    if (action === 'register-locate') {
      const locationInput = document.getElementById('registerLocation');
      if (!navigator.geolocation) {
        toast('الموقع غير مدعوم على الجهاز');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const value = `https://maps.google.com/?q=${latitude},${longitude}`;
          if (locationInput) locationInput.value = value;
          smartToast('success.register', 'تم تحديد الموقع', true);
        },
        () => {
          toast('تعذر تحديد الموقع');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
      return;
    }
    if (action === 'back-login') {
      navigate('#home');
      openLogin();
      return;
    }
    if (action === 'select-customer') return selectCustomer(target.getAttribute('data-customer-id'));
    if (action === 'set-unit') {
      const productId = target.getAttribute('data-product-id');
      const unit = target.getAttribute('data-unit');
      syncUnitPreference(productId, unit);
      resetCheckoutStage();
      renderApp();
      return;
    }
    if (action === 'open-product') return openProductModal(target.getAttribute('data-product-id'));
    if (action === 'open-offer') return openOfferModal(target.getAttribute('data-offer-type'), target.getAttribute('data-id'));
    if (action === 'toggle-product') return toggleProductFromCard(target.getAttribute('data-product-id'));
    if (action === 'toggle-deal') return toggleDeal('deal', target.getAttribute('data-id'));
    if (action === 'toggle-flash') return toggleDeal('flash', target.getAttribute('data-id'));
    if (action === 'qty-up') return qtyAdjust(target.getAttribute('data-key'), 1);
    if (action === 'qty-down') return qtyAdjust(target.getAttribute('data-key'), -1);
    if (action === 'remove-item') return removeCartItem(target.getAttribute('data-key'));
    if (action === 'select-tier') {
      const tier = {
        tier_name: target.getAttribute('data-tier-name'),
        visible_label: target.getAttribute('data-visible-label'),
      };
      const matched = state.tiers.find((row) => row.tier_name === tier.tier_name) || tier;
      await handleSelectTier(matched);
      return;
    }
    if (action === 'invoices') {
      toggleUserMenu(false);
      navigate('#invoices');
      return;
    }
    if (action === 'logout') {
      logout();
      return;
    }
    if (action === 'refresh-invoices') {
      state.invoicesLoaded = false;
      await loadInvoices();
      renderApp();
      return;
    }
  });

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el.matches('[data-role="cart-qty"]')) {
      setCartQty(el.getAttribute('data-key'), el.value);
    }
    if (el.matches('[data-role="product-qty"]')) {
      setProductQty(el.getAttribute('data-product-id'), el.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLogin();
      closeCart();
      toggleUserMenu(false);
    }
    if (event.key === 'Enter' && document.activeElement === els.loginPassword) {
      handleLogin();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideUser = event.target.closest('.user-wrap');
    if (!clickedInsideUser) toggleUserMenu(false);
    const clickedInsideModal = event.target.closest('.modal-card');
    if (!clickedInsideModal && event.target === els.loginModal) closeLogin();
    if (!clickedInsideModal && event.target === els.myDataModal) closeMyData();
    if (event.target === els.cartDrawer) closeCart();
  });

  if (els.homeBtn) els.homeBtn.addEventListener('click', () => { state.search = ''; navigate('#home'); });
  els.tierBtn.addEventListener('click', () => navigate('#tiers'));
  els.dealsBtn.addEventListener('click', () => navigate('#deals'));
  els.flashBtn.addEventListener('click', () => navigate('#flash'));
  els.cartBtn.addEventListener('click', openCart);
  els.userBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!state.session) {
      openLogin();
      return;
    }
    toggleUserMenu();
  });
  els.submitLogin.addEventListener('click', handleLogin);
  const openRegisterBtn = document.getElementById('openRegister');
  if (openRegisterBtn) openRegisterBtn.addEventListener('click', openRegisterPage);
  if (els.checkoutBtn) {
    els.checkoutBtn.onclick = async () => {
      await handleCheckout();
    };
  }
  els.saveCartBtn.addEventListener('click', () => {
    persistCart();
    toast('تم حفظ السلة');
  });
}



function triggerSmartBehavior() {
  if (!canShowMessage()) return;

  const tier = getSelectedTierObject();
  const now = Date.now();

  if (!tier && now - state.behavior.lastTierPrompt > 60000) {
    state.behavior.lastTierPrompt = now;
    smartToast('tier.missing', undefined, true);
    return;
  }

  if (state.cart.length === 0 && now - state.behavior.lastCartActivity > 45000 && now - state.behavior.lastCartPrompt > 45000) {
    state.behavior.lastCartPrompt = now;
    smartToast('cart.idle', undefined, true);
    return;
  }

  if (!state.behavior.visitedDeals && now - state.behavior.lastDealsPrompt > 90000) {
    state.behavior.lastDealsPrompt = now;
    smartToast('deals.suggest', undefined, true);
    return;
  }

  const flashState = getFlashState();
  if (flashState.status === 'active' && now - state.behavior.lastFlashPrompt > 90000) {
    state.behavior.lastFlashPrompt = now;
    smartToast('deals.active', undefined, true);
  }
}

function scheduleSmartPulse() {
  clearTimeout(salesPulseTimer);
  salesPulseTimer = setTimeout(() => {
    triggerSmartBehavior();
    scheduleSmartPulse();
  }, randomDelay());
}

async function tick() {
  updateHeader();
  const current = parseHash();
  if (current.type === 'flash') {
    renderApp();
    return;
  }
  updateFlashHeader();
}

async function init() {
  wireGlobalEvents();
  renderCart();
  updateHeader();
  await loadData();
  syncCheckoutButton();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  clearInterval(dynamicTimer);
  dynamicTimer = setInterval(tick, 1000);
  scheduleSmartPulse();
}

init();

/* === Premium multi-theme layer === */
(function () {
  const THEME_STORAGE_KEY = 'b2b_theme';
  const THEMES = {
    gold: {
      label: 'Royal Gold',
      color: '#D4AF37',
      vars: {
        '--bg': '#070707',
        '--bg-2': '#0e0d0b',
        '--surface': '#121212',
        '--surface-2': '#171513',
        '--surface-3': '#1d1a16',
        '--line': 'rgba(255, 215, 120, 0.14)',
        '--line-strong': 'rgba(212, 175, 55, 0.42)',
        '--text': '#f8f4ea',
        '--muted': '#b9b1a1',
        '--primary': '#d4af37',
        '--primary-2': '#f4d66f',
        '--accent': '#ffeb9f',
        '--success': '#45d483',
        '--danger': '#ff6c6c',
        '--shadow': '0 22px 60px rgba(0,0,0,.52)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.28)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(212,175,55,.18), transparent 34%), linear-gradient(145deg, rgba(18,18,18,.98), rgba(7,7,7,.98))',
        '--cta-grad': 'linear-gradient(135deg, #f7de86 0%, #d4af37 48%, #9f7a12 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(24,22,18,.98), rgba(12,11,10,.98))',
        '--glow': '0 0 0 1px rgba(212,175,55,.16), 0 0 32px rgba(212,175,55,.14)',
        '--focus': 'rgba(212,175,55,.18)',
        '--chip-bg': 'rgba(255,255,255,.04)',
      },
    },
    navy: {
      label: 'Navy Premium',
      color: '#1B4D8C',
      vars: {
        '--bg': '#06101d',
        '--bg-2': '#081524',
        '--surface': '#0d1b2a',
        '--surface-2': '#102235',
        '--surface-3': '#15314a',
        '--line': 'rgba(63, 169, 245, 0.14)',
        '--line-strong': 'rgba(63, 169, 245, 0.42)',
        '--text': '#f1f5f9',
        '--muted': '#aab7c6',
        '--primary': '#1b4d8c',
        '--primary-2': '#3fa9f5',
        '--accent': '#7dd3fc',
        '--success': '#36d399',
        '--danger': '#fb7185',
        '--shadow': '0 22px 60px rgba(0,0,0,.48)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.28)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(63,169,245,.20), transparent 34%), linear-gradient(145deg, rgba(13,27,42,.98), rgba(6,16,29,.98))',
        '--cta-grad': 'linear-gradient(135deg, #6cc4ff 0%, #3fa9f5 48%, #1b4d8c 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(14,31,48,.98), rgba(8,17,29,.98))',
        '--glow': '0 0 0 1px rgba(63,169,245,.18), 0 0 32px rgba(63,169,245,.14)',
        '--focus': 'rgba(63,169,245,.16)',
        '--chip-bg': 'rgba(255,255,255,.04)',
      },
    },
    orange: {
      label: 'Orange Energy',
      color: '#FF7A00',
      vars: {
        '--bg': '#080808',
        '--bg-2': '#111111',
        '--surface': '#171717',
        '--surface-2': '#1d1d1d',
        '--surface-3': '#242424',
        '--line': 'rgba(255, 122, 0, 0.16)',
        '--line-strong': 'rgba(255, 122, 0, 0.45)',
        '--text': '#ffffff',
        '--muted': '#c3c3c3',
        '--primary': '#ff7a00',
        '--primary-2': '#ff9f43',
        '--accent': '#ffd08a',
        '--success': '#34d399',
        '--danger': '#ff7f7f',
        '--shadow': '0 22px 60px rgba(0,0,0,.55)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.30)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(255,122,0,.22), transparent 34%), linear-gradient(145deg, rgba(23,23,23,.98), rgba(8,8,8,.98))',
        '--cta-grad': 'linear-gradient(135deg, #ffb15b 0%, #ff7a00 48%, #b94d00 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(34,30,27,.98), rgba(12,12,12,.98))',
        '--glow': '0 0 0 1px rgba(255,122,0,.18), 0 0 34px rgba(255,122,0,.16)',
        '--focus': 'rgba(255,122,0,.16)',
        '--chip-bg': 'rgba(255,255,255,.04)',
      },
    },
    emerald: {
      label: 'Emerald Green',
      color: '#00A86B',
      vars: {
        '--bg': '#07130e',
        '--bg-2': '#0a1b14',
        '--surface': '#10221a',
        '--surface-2': '#143026',
        '--surface-3': '#1b3a2c',
        '--line': 'rgba(56, 217, 150, 0.15)',
        '--line-strong': 'rgba(56, 217, 150, 0.42)',
        '--text': '#f4fff8',
        '--muted': '#b1c8bb',
        '--primary': '#00a86b',
        '--primary-2': '#38d996',
        '--accent': '#b3f6d2',
        '--success': '#49e18f',
        '--danger': '#ff8a8a',
        '--shadow': '0 22px 60px rgba(0,0,0,.50)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.28)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(56,217,150,.20), transparent 34%), linear-gradient(145deg, rgba(16,34,26,.98), rgba(7,19,14,.98))',
        '--cta-grad': 'linear-gradient(135deg, #5ef0b0 0%, #38d996 48%, #10915f 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(18,37,29,.98), rgba(8,20,15,.98))',
        '--glow': '0 0 0 1px rgba(56,217,150,.18), 0 0 34px rgba(56,217,150,.15)',
        '--focus': 'rgba(56,217,150,.15)',
        '--chip-bg': 'rgba(255,255,255,.04)',
      },
    },
    black: {
      label: 'Pure Black',
      color: '#000000',
      vars: {
        '--bg': '#000000',
        '--bg-2': '#050505',
        '--surface': '#0A0A0A',
        '--surface-2': '#111111',
        '--surface-3': '#171717',
        '--line': 'rgba(255,255,255,.08)',
        '--line-strong': 'rgba(255,255,255,.18)',
        '--text': '#ffffff',
        '--muted': '#b5b5b5',
        '--primary': '#ffffff',
        '--primary-2': '#dcdcdc',
        '--accent': '#f0f0f0',
        '--success': '#41d18a',
        '--danger': '#ff6b6b',
        '--shadow': '0 24px 64px rgba(0,0,0,.72)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.40)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(255,255,255,.08), transparent 34%), linear-gradient(145deg, rgba(10,10,10,.99), rgba(0,0,0,.99))',
        '--cta-grad': 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 48%, #c9c9c9 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(18,18,18,.99), rgba(6,6,6,.99))',
        '--glow': '0 0 0 1px rgba(255,255,255,.12), 0 0 34px rgba(255,255,255,.10)',
        '--focus': 'rgba(255,255,255,.12)',
        '--chip-bg': 'rgba(255,255,255,.04)',
      },
    },
    white: {
      label: 'Pure White',
      color: '#F7F7F7',
      vars: {
        '--bg': '#F7F7F7',
        '--bg-2': '#EFEFEF',
        '--surface': '#FFFFFF',
        '--surface-2': '#FAFAFA',
        '--surface-3': '#F1F1F1',
        '--line': 'rgba(0,0,0,.08)',
        '--line-strong': 'rgba(0,0,0,.16)',
        '--text': '#111111',
        '--muted': '#5C5C5C',
        '--primary': '#111111',
        '--primary-2': '#2F2F2F',
        '--accent': '#111111',
        '--success': '#0e9f6e',
        '--danger': '#d64545',
        '--shadow': '0 22px 60px rgba(0,0,0,.10)',
        '--shadow-soft': '0 10px 24px rgba(0,0,0,.08)',
        '--hero-grad': 'radial-gradient(circle at top right, rgba(0,0,0,.05), transparent 34%), linear-gradient(145deg, rgba(255,255,255,.99), rgba(247,247,247,.99))',
        '--cta-grad': 'linear-gradient(135deg, #111111 0%, #2f2f2f 48%, #0b0b0b 100%)',
        '--card-grad': 'linear-gradient(180deg, rgba(255,255,255,.98), rgba(245,245,245,.98))',
        '--glow': '0 0 0 1px rgba(0,0,0,.08), 0 0 24px rgba(0,0,0,.08)',
        '--focus': 'rgba(0,0,0,.08)',
        '--chip-bg': 'rgba(0,0,0,.03)',
      },
    },
  };

  const root = document.documentElement;

  function getThemeKey() {
    const saved = String(localStorage.getItem(THEME_STORAGE_KEY) || 'gold').trim().toLowerCase();
    return THEMES[saved] ? saved : 'gold';
  }

  function applyTheme(themeKey = getThemeKey(), persist = true) {
    const key = THEMES[themeKey] ? themeKey : 'gold';
    const theme = THEMES[key];

    document.body.dataset.theme = key;
    Object.entries(theme.vars).forEach(([prop, value]) => root.style.setProperty(prop, value));
    root.style.setProperty('--theme-color', theme.color);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.color);

    if (persist) localStorage.setItem(THEME_STORAGE_KEY, key);
    updateThemeDots();
    return key;
  }

  function createThemeSwitcher() {
    const current = getThemeKey();
    const wrap = document.createElement('div');
    wrap.className = 'theme-switcher';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'اختيار الثيم');
    wrap.innerHTML = Object.entries(THEMES).map(([key, theme]) => `
      <button type="button" class="theme-dot ${key === current ? 'active' : ''}" data-action="set-theme" data-theme-key="${key}" aria-label="${theme.label}" title="${theme.label}" style="--theme-color:${theme.color}"></button>
    `).join('');
    return wrap;
  }

  function updateThemeDots() {
    document.querySelectorAll('.theme-dot').forEach((dot) => {
      dot.classList.toggle('active', dot.getAttribute('data-theme-key') === getThemeKey());
    });
  }

  function decorateHero() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;
    const actions = hero.querySelector('.hero-actions');
    if (!actions || hero.querySelector('.theme-switcher')) return;
    actions.insertAdjacentElement('afterend', createThemeSwitcher());
  }

  function bootstrapTheme() {
    applyTheme(getThemeKey(), false);
    decorateHero();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action="set-theme"], [data-theme-key]');
    if (!target) return;
    const key = target.getAttribute('data-theme-key');
    if (!key || !THEMES[key]) return;
    event.preventDefault();
    applyTheme(key, true);
    decorateHero();
  });

  const observer = new MutationObserver(() => decorateHero());
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapTheme, { once: true });
  } else {
    bootstrapTheme();
  }

  window.applyB2BTheme = applyTheme;
})();
