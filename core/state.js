const CONFIG = {
  baseUrl: 'https://upzuslyqfcvpbkqyzyxp.supabase.co/rest/v1',
  apiKey: 'sb_publishable_vpqJxVuMbYbm0y3VvVhuJw_FBQkLvYg',
  supportWhatsapp: localStorage.getItem('support_whatsapp') || '201552670465',
};

const STORAGE = {
  session: 'b2b_session',
  cart: 'b2b_cart',
  tier: 'selected_tier',
  unitPrefs: 'b2b_unit_prefs',
  productQtyPrefs: 'b2b_product_qty_prefs',
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
  behavior: {
    visitedDeals: false,
    visitedFlash: false,
    lastCartActivity: Date.now(),
    lastTierPrompt: 0,
    lastDealsPrompt: 0,
    lastFlashPrompt: 0,
    lastCartPrompt: 0,
    lastTrackedHash: '',
    lastTrackedCompany: '',
    lastRecommendationSignalAt: 0,
  },
  topProducts: [],
  productPopularity: [],
  customerRecommendations: [],
  viewCounts: loadJSON('b2b_view_counts', {}),
};

const els = {
  mainHeader: document.getElementById('mainHeader'),
  banner: document.getElementById('banner'),
  searchBar: document.getElementById('searchBar'),
  pageContent: document.getElementById('pageContent'),
  registerPage: document.getElementById('registerPage'),
  homeBtn: document.getElementById('homeBtn'),
  tierBtn: document.getElementById('tierBtn'),
  dealsBtn: document.getElementById('dealsBtn'),
  flashBtn: document.getElementById('flashBtn'),
  flashBtnText: document.getElementById('flashBtnText'),
  flashBtnMeta: document.getElementById('flashBtnMeta'),
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

let toastTimer = null;
let dynamicTimer = null;
let salesPulseTimer = null;
const toastState = {
  lastMessage: '',
  lastAt: 0,
};
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
  if (location.hash === hash) {
    handleRoute();
    return;
  }
  location.hash = hash;
}
function toast(message) {
  const text = sanitizeToastMessage(message);
  if (!text || !els.toast) return false;

  const now = Date.now();
  if (text === toastState.lastMessage && now - toastState.lastAt < 1200) {
    return false;
  }

  toastState.lastMessage = text;
  toastState.lastAt = now;

  els.toast.textContent = text;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 4000);
  return true;
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
function toggleUserMenu(force) {
  const next = typeof force === 'boolean' ? force : els.userMenu.classList.contains('hidden');
  els.userMenu.classList.toggle('hidden', !next);
  els.userMenu.setAttribute('aria-hidden', String(!next));
}
function getSessionLabel() {
  if (!state.session) return 'تسجيل الدخول';
  return state.session.name || state.session.username || state.session.phone || 'مستخدم';
}
