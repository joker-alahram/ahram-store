/* utils.runtime.js — shared utilities, notifications, data access, and ranking */



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

  const mark = document.createElement('div');
  mark.className = 'notify-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = meta.icon;

  const body = document.createElement('div');
  body.className = 'notify-body';

  if (title) {
    const titleNode = document.createElement('div');
    titleNode.className = 'notify-title';
    titleNode.textContent = title;
    body.appendChild(titleNode);
  }

  if (message) {
    const messageNode = document.createElement('div');
    messageNode.className = 'notify-message';
    messageNode.textContent = message;
    body.appendChild(messageNode);
  }

  node.append(mark, body);

  if (action && action.label) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'notify-action';
    actionBtn.textContent = sanitizeToastMessage(action.label);
    actionBtn.addEventListener('click', (event) => {
      event.preventDefault();
      try {
        action.onClick();
      } catch (error) {
        console.warn('notify action error:', error);
      }
    });
    node.appendChild(actionBtn);
  }

  return { node, type };
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


function escapeIfText(value) {
  return escapeHtml(value ?? '');
}


function closeNavDrawer() {
  if (!els.navDrawer) return;
  setOverlay(els.navDrawer, false);
}


function openNavDrawer() {
  if (!els.navDrawer) return;
  setOverlay(els.navDrawer, true);
}


function toggleNavDrawer(force) {
  if (!els.navDrawer) return;
  const next = typeof force === 'boolean' ? force : els.navDrawer.classList.contains('hidden');
  setOverlay(els.navDrawer, next);
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


function appBannerImage() {
  return pickSetting(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
}


function companyBannerHtml() {
  const image = appBannerImage();
  if (image) {
    return `
      <section class="company-banner-surface" aria-label="بانر الشركة">
        <img class="company-banner-image" src="${escapeHtml(image)}" alt="بانر الشركة" loading="eager" />
      </section>
    `;
  }
  const company = escapeHtml(settingValue('company_name', 'الأهرام للتجارة والتوزيع'));
  const subtitle = escapeHtml(settingValue('banner_subtitle', 'Branding only'));
  return `
    <section class="company-banner-surface company-banner-fallback" aria-label="بانر الشركة">
      <div class="company-banner-fallback-copy">
        <span class="company-banner-kicker">Branding only</span>
        <strong>${company}</strong>
        <small>${subtitle}</small>
      </div>
    </section>
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
      fetchCollection('v_products', { select: 'product_id,product_name,product_image,company_id,has_carton,has_pack,carton_price,pack_price,allow_discount,discount_pack', order: 'product_name.asc' }, []),
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
    state.productMap = new Map(state.products.map((product) => [String(product.product_id), product]));

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

    refreshProductPricingPreviews();

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


function renderCart() {
  const totals = cartTotals();
  const fullTotal = totals.total;
  const eligibleTotal = totals.eligible;
  const tier = getSelectedTierObject();
  const minOrder = selectedTierMinimum();
  const remaining = tier ? Math.max(0, minOrder - eligibleTotal) : null;

  const itemCount = state.cart.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  const progress = tier && minOrder > 0 ? Math.max(0, Math.min(100, (eligibleTotal / minOrder) * 100)) : 0;
  const summaryPricing = totals.snapshot || null;
  const summaryHtml = `
    ${typeof pricingBoxHtml === 'function' ? pricingBoxHtml(summaryPricing, {
      summary: true,
      className: 'pricing-box--summary',
      title: 'ملخص التسعير',
      subtitle: tier ? tierDisplayLabel(tier) : 'الإجمالي الحالي',
      open: false,
    }) : ''}
    <div class="cart-summary">
      <div class="cart-summary-grid">
        <div class="cart-summary-card">
          <span class="cart-summary-label">عدد المنتجات</span>
          <strong class="cart-summary-value mono">${integer(itemCount)}</strong>
        </div>
        <div class="cart-summary-card">
          <span class="cart-summary-label">قيمة الطلب</span>
          <strong class="cart-summary-value mono">${num(fullTotal)} ج.م</strong>
        </div>
        <div class="cart-summary-card ${tier ? '' : 'is-muted'}">
          <span class="cart-summary-label">${tier ? 'حالة الشريحة' : 'الشريحة غير محددة'}</span>
          <strong class="cart-summary-value mono">${tier ? tierDisplayLabel(tier) : '—'}</strong>
        </div>
        <div class="cart-summary-card">
          <span class="cart-summary-label">التقدم نحو الحد الأدنى</span>
          <strong class="cart-summary-value mono">${tier ? `${integer(progress)}%` : '—'}</strong>
        </div>
      </div>
      ${tier ? `<div class="cart-progress"><span style="width:${progress}%"></span></div>` : ''}
      ${tier ? `<div class="helper-text">${remaining > 0 ? `متبقي ${num(remaining)} ج.م للوصول إلى الحد الأدنى.` : 'السلة مؤهلة بالكامل.'}</div>` : ''}
    </div>
  `;

  if (!state.cart.length) {
    setPersistentHtml(els.cartItems, `${summaryHtml}<div class="empty-state">السلة فارغة الآن</div>`);
    els.cartTotal.textContent = integer(fullTotal);
    syncCheckoutButton();
    updateHeader();
    return;
  }

  setPersistentHtml(els.cartItems, `${summaryHtml}${state.cart.map((item) => {
    const badgeText = describeCartBadge(item);
    return `
    <div class="cart-item">
      <img src="${escapeHtml(item.image || placeholderImage(item.title))}" alt="${escapeHtml(item.title)}" loading="lazy" />
      <div>
        <div class="cart-topline">
          <h4 class="cart-title">${escapeHtml(item.title)}</h4>
          <span class="cart-item-badge ${item.type === 'product' ? 'badge-product' : item.type === 'deal' ? 'badge-deal' : 'badge-flash'}">${escapeHtml(badgeText)}</span>
        </div>
        <div class="cart-meta">${escapeHtml(item.company || '')}</div>
        ${typeof pricingBoxHtml === 'function' ? pricingBoxHtml(item.pricing, {
          compact: true,
          className: 'pricing-box--cart-line',
          title: item.title || 'تفاصيل السعر',
          subtitle: item.unitLabel || item.unit || '',
        }) : `<div class="cart-price">${escapeHtml(item.unitLabel || item.unit || '')} · ${num(item.pricing?.unit || 0)} ج.م</div>`}
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
  `;
  }).join('')}`);

  els.cartTotal.textContent = integer(fullTotal);
  syncCheckoutButton();
  updateHeader();
}

