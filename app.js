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
  },
};

const els = {
  banner: document.getElementById('banner'),
  searchBar: document.getElementById('searchBar'),
  pageContent: document.getElementById('pageContent'),
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

function toast(message) {
  els.toast.textContent = sanitizeToastMessage(message);
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2400);
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
  els.tierBtn.textContent = tierLabel;
  els.userBtn.textContent = getSessionLabel();
  if (els.cartLabel) els.cartLabel.textContent = 'إتمام الشراء';
  els.cartValue.textContent = integer(cartTotal());
  updateFlashHeader();
  syncCheckoutButton();
}

function updateFlashHeader() {
  const flashState = getFlashState();
  if (!flashState.offer) {
    els.flashBtnText.textContent = 'عرض الساعة';
    els.flashBtnMeta.textContent = '';
    els.flashBtn.classList.remove('status-active', 'status-danger');
    return;
  }

  const { status, remaining, endedAt } = flashState;
  if (status === 'active') {
    els.flashBtnText.textContent = 'عرض الساعة';
    els.flashBtnMeta.textContent = remaining;
    els.flashBtn.classList.add('status-active');
    els.flashBtn.classList.remove('status-danger');
    return;
  }

  if (status === 'expired') {
    els.flashBtnText.textContent = 'انتهى العرض';
    els.flashBtnMeta.textContent = endedAt;
    els.flashBtn.classList.remove('status-active');
    els.flashBtn.classList.add('status-danger');
    return;
  }

  els.flashBtnText.textContent = 'عرض الساعة';
  els.flashBtnMeta.textContent = 'قريبًا';
  els.flashBtn.classList.remove('status-active');
  els.flashBtn.classList.remove('status-danger');
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
  pending: 'تحت المراجعة',
  confirmed: 'تم الموافقة',
  processing: 'تحت التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم الاستلام',
  paid: 'تم الدفع',
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
  state.tierPrices = { carton: new Map(), pack: new Map() };
  syncCartPricesFromCurrentState();
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
    const [companies, products, dailyDeals, flashOffers, tiers, settings] = await Promise.all([
      apiGet('companies', { select: 'company_id,company_name,company_logo,visible,allow_discount', visible: 'eq.true', order: 'company_name.asc' }),
      apiGet('v_products', { select: 'product_id,product_name,product_image,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount', order: 'product_name.asc' }),
      apiGet('v_daily_deals', { select: '*', order: 'id.desc' }),
      apiGet('v_flash_offers', { select: '*', order: 'start_time.desc' }),
      apiGet('tiers', { select: 'tier_name,visible_label,min_order,discount_percent', order: 'min_order.asc' }),
      apiGet('app_settings', { select: 'key,value,updated_at', order: 'updated_at.desc' }).catch(() => []),
    ]);

    state.companies = companies || [];
    state.products = products || [];
    state.dailyDeals = dailyDeals || [];
    state.flashOffers = flashOffers || [];
    state.tiers = tiers || [];
    state.settings = settings || [];
    state.settingMap = new Map((settings || []).map((row) => [row.key, row.value]));
    state.companyMap = new Map(state.companies.map((company) => [company.company_id, company]));

    if (state.selectedTier) {
      const matched = state.tiers.find((tier) => tier.tier_name === tierName()) || state.selectedTier;
      state.selectedTier = matched;
      saveJSON(STORAGE.tier, matched);
      await loadTierPrices(matched);
    }

    syncCartPricesFromCurrentState();
    resetCheckoutStage();
    renderCart();
    renderApp();
  } catch (error) {
    console.error(error);
    toast('تعذر تحميل البيانات من قاعدة البيانات');
    renderApp();
  }
}

function filteredCompanies() {
  const q = normalizeText(state.search);
  if (!q) return state.companies;
  return state.companies.filter((company) => {
    return normalizeText(company.company_name).includes(q) || normalizeText(company.company_id).includes(q);
  });
}

function filteredProducts() {
  let items = [...state.products];
  if (state.view.type === 'company' && state.view.companyId) {
    items = items.filter((product) => product.company_id === state.view.companyId);
  }
  const q = normalizeText(state.search);
  if (q) {
    items = items.filter((product) => {
      return normalizeText(product.product_name).includes(q)
        || normalizeText(product.product_id).includes(q)
        || normalizeText(companyName(product.company_id)).includes(q);
    });
  }
  return items;
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
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.product_name)}" loading="lazy" />
      <div class="product-body">
        <div>
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
            ${inCart ? 'إزالة' : 'شراء'}
          </button>
        </div>
      </div>
    </article>
  `;
}


function renderRegisterPage() {
  const target = els.pageContent || els.registerPage;
  if (!target) return;

  target.innerHTML = `
    <section class="register-shell">
      <div class="section-card register-card">
        <div class="register-hero">
          <h1>تسجيل عميل جديد</h1>
          <p>سجّل عميلك مباشرة من الموبايل، من غير مودال، ومن غير تعقيد. الحساب بيتنشأ فورًا وبعدها يدخل تلقائي على المتجر.</p>
        </div>

        <form class="register-form" id="registerForm" autocomplete="on">
          <div class="register-grid">
            <label class="field">
              <span>الاسم الكامل</span>
              <input id="registerName" type="text" placeholder="الاسم رباعي أو ثنائي على الأقل" autocomplete="name" />
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
              <input id="registerBusinessName" type="text" placeholder="اسم المحل أو الشركة" autocomplete="organization" />
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
  const companies = filteredCompanies();
  const bannerHtml = banner
    ? `<img class="banner-image" src="${escapeHtml(banner)}" alt="بانر الصفحة الرئيسية" loading="eager" />`
    : `<div class="banner-fallback">لا توجد صورة بانر</div>`;

  if (els.banner) {
    els.banner.innerHTML = `
      <section class="banner-card">
        ${bannerHtml}
      </section>
    `;
  }

  setSearchBarHtml(`
    <section class="section-card search-card">
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="ابحث باسم الشركة" value="${escapeHtml(state.search)}" />
        <button class="mini-btn icon-btn" id="clearSearchBtn" type="button">×</button>
      </div>
    </section>
  `);

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="grid company-grid">
        ${companies.length ? companies.map((company) => `
          <article class="company-card" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}">
            <img class="company-logo" src="${escapeHtml(company.company_logo || placeholderImage(company.company_name))}" alt="${escapeHtml(company.company_name)}" loading="lazy" />
            <div class="company-name">${escapeHtml(company.company_name)}</div>
          </article>
        `).join('') : `<div class="empty-state">لا توجد شركات ظاهرة الآن</div>`}
      </section>
    </div>
  `;
}

function renderCompanyPage() {
  const title = companyName(state.view.companyId);
  const products = filteredProducts();

  setSearchBarHtml(`
    <section class="section-card search-card">
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
            <h2>الشرائح</h2>
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
            <div class="helper-text">بطاقة واحدة في كل صف</div>
          </div>
        </div>
      </section>
      <section class="deal-list">
        ${state.dailyDeals.length ? state.dailyDeals.map((deal) => dealCardHtml(deal, 'deal')).join('') : `<div class="empty-state">لا توجد صفقة اليوم الآن</div>`}
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
    ? 'الدفع مقدمًا'
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
        ${state.flashOffers.length ? state.flashOffers.map((offer) => dealCardHtml(offer, 'flash', active)).join('') : `<div class="empty-state">لا توجد عروض الساعة</div>`}
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
  if (['submitted', 'confirmed', 'completed'].includes(value)) return 'status-active';
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
      ? 'إزالة'
      : 'شراء';
  const buttonDisabled = !canBuy;
  const metaLine = type === 'flash'
    ? (item.status === 'active' ? `متبقي: ${countdownTo(item.end_time)}` : item.status === 'expired' ? `انتهى: ${formatDateTime(item.end_time)}` : `يبدأ: ${formatDateTime(item.start_time)}`)
    : `المخزون: ${integer(item.stock || 0)}`;

  return `
    <article class="deal-card">
      <img class="deal-image" src="${image}" alt="${title}" loading="lazy" />
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
          <button class="primary-btn" data-action="toggle-${type}" data-id="${escapeHtml(item.id)}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
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
  if (els.pageContent) els.pageContent.classList.remove('hidden');
  if (els.registerPage) els.registerPage.classList.add('hidden');

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
      state.search = event.target.value.trim();
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
  state.search = String(value || '').trim();
  renderApp();
}

function setSelectedTier(tier, persist = true) {
  state.selectedTier = tier;
  if (persist) saveJSON(STORAGE.tier, tier);
}

async function handleSelectTier(tier) {
  const current = tierName();
  if (current === tier.tier_name) {
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
        <div class="qty-row">
          <button data-action="qty-down" data-key="${escapeHtml(item.key)}" type="button">-</button>
          <input data-role="cart-qty" data-key="${escapeHtml(item.key)}" type="number" min="1" value="${integer(item.qty || 1)}" inputmode="numeric" />
          <button data-action="qty-up" data-key="${escapeHtml(item.key)}" type="button">+</button>
          <button class="ghost-btn" data-action="remove-item" data-key="${escapeHtml(item.key)}" type="button">حذف</button>
        </div>
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
    smartToast('tier.missing', 'اختار شريحة الأول عشان تاخد خصم 🔥', true);
    return false;
  }

  const total = cartTotal();

  if (total < tier.min_order) {
    const diff = tier.min_order - total;
    smartToast('tier.incomplete', `فاضل ${diff.toFixed(0)} جنيه وتكمل الشريحة 💰`, true);
    return false;
  }

  return true;
}

function buildOrderPayload() {
  const isRep = state.session.userType === 'rep';

  return {
    order_number: 'INV-' + Date.now(),
    user_type: state.session.userType,
    customer_id: isRep ? state.selectedCustomer.id : state.session.id,
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
  const payload = buildOrderPayload();
  const res = await apiPost('orders', payload);

  if (!res || !res[0]) {
    throw new Error('Order creation failed');
  }

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
    if (state.checkoutStage === 'validate') {
      smartToast('checkout.validate', 'تم التحقق من الطلب ✔', true);
      state.checkoutStage = 'submit';
      syncCheckoutButton();
      return;
    }

    if (state.checkoutStage === 'submit') {
      const order = await createOrder();
      console.log('ORDER CREATED:', order.id);
      await insertOrderItems(order.id);
      sendToWhatsApp(order, state.cart);

      smartToast('success.order', 'تم إرسال الطلب بنجاح', true);

      state.cart = [];
      persistCart();

      state.checkoutStage = 'validate';
      syncCheckoutButton();
      renderCart();
      renderApp();
      closeCart();
    }
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
  if (state.view.type === 'deals') state.behavior.visitedDeals = true;
  if (state.view.type === 'flash') state.behavior.visitedFlash = true;
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
    if (closeTarget === 'cartDrawer') return closeCart();
    if (closeTarget === 'registerPage') return closeRegisterPage();

    const action = target.getAttribute('data-action');
    if (action === 'open-company') {
      const companyId = target.getAttribute('data-company-id');
      navigate(`#company/${encodeURIComponent(companyId)}`);
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

  if (els.homeBtn) els.homeBtn.addEventListener('click', () => navigate('#home'));
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
