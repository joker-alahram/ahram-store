'use strict';

const STORAGE = {
  session: 'ahram_b2b_session',
  cart: 'ahram_b2b_cart',
  tier: 'ahram_b2b_tier',
  theme: 'ahram_b2b_theme',
  flashEnds: 'ahram_b2b_flash_ends',
  tierSeen: 'ahram_b2b_tier_seen',
  search: 'ahram_b2b_search',
};

const themes = [
  { key: 'gold', label: 'ذهبي', color: '#d6b15a' },
  { key: 'navy', label: 'كحلي', color: '#2d73ff' },
  { key: 'light', label: 'فاتح', color: '#7f8ea7' },
  { key: 'emerald', label: 'أخضر', color: '#1ea36b' },
  { key: 'purple', label: 'بنفسجي', color: '#9b63ff' },
  { key: 'slate', label: 'رمادي', color: '#66788f' },
];

const tiers = [
  { id: 'visitor', name: 'زائر', min: 0, target: 5000, desc: 'عرض دخول بسيط للتصفح والشراء المبدئي.', badge: 'أساسي' },
  { id: 'customer', name: 'عميل', min: 5000, target: 10000, desc: 'سعر تجاري أفضل وحركة شراء ثابتة.', badge: 'تجاري' },
  { id: 'rep', name: 'مندوب', min: 10000, target: 15000, desc: 'صالح للزيارات والطلبات والفواتير.', badge: 'تشغيلي' },
];

const companies = [
  { id: 1, name: 'L’ORÉAL PARIS', short: 'LR', color: '#2b5ba8' },
  { id: 2, name: 'P&G', short: 'P&G', color: '#2f60c8' },
  { id: 3, name: 'Unilever', short: 'UN', color: '#3463b7' },
  { id: 4, name: 'Dove', short: 'DV', color: '#1e4fb3' },
  { id: 5, name: 'NIVEA', short: 'NV', color: '#113a85' },
  { id: 6, name: 'Garnier', short: 'GA', color: '#74b528' },
];

const products = [
  { id: 101, title: 'شامبو لوريال 400 مل', company: 'L’ORÉAL PARIS', category: 'شامبوهات', price: 120, oldPrice: 135, unit: '400 مل', sales: 190, views: 420, stock: 42, type: 'bottle', tone: '#e64d88' },
  { id: 102, title: 'دوف شامبو 500 مل', company: 'Dove', category: 'شامبوهات', price: 135, oldPrice: 149, unit: '500 مل', sales: 220, views: 510, stock: 39, type: 'bottle', tone: '#d9e6f3' },
  { id: 103, title: 'كريم نيفيا 50 مل', company: 'NIVEA', category: 'كريمات', price: 110, oldPrice: 124, unit: '50 مل', sales: 180, views: 330, stock: 30, type: 'jar', tone: '#184b9e' },
  { id: 104, title: 'رول اون نيفيا 50 مل', company: 'NIVEA', category: 'رول أون', price: 80, oldPrice: 92, unit: '50 مل', sales: 260, views: 390, stock: 55, type: 'roll', tone: '#dce9f4' },
  { id: 105, title: 'سبراي فكس 300 مل', company: 'Garnier', category: 'اسبراي', price: 95, oldPrice: 110, unit: '300 مل', sales: 140, views: 260, stock: 41, type: 'spray', tone: '#111b35' },
  { id: 106, title: 'صبغة غارنييه بني 1', company: 'Garnier', category: 'صبغات', price: 70, oldPrice: 82, unit: '1 عبوة', sales: 165, views: 301, stock: 36, type: 'box', tone: '#7a4cff' },
  { id: 107, title: 'غسول وجه دوف 250 مل', company: 'Dove', category: 'غسول', price: 85, oldPrice: 96, unit: '250 مل', sales: 200, views: 280, stock: 29, type: 'tube', tone: '#d6edf7' },
  { id: 108, title: 'كريم شعر بالبلسم 250 مل', company: 'Unilever', category: 'كريمات', price: 100, oldPrice: 115, unit: '250 مل', sales: 150, views: 240, stock: 33, type: 'jar', tone: '#6b7dd1' },
  { id: 109, title: 'بلسم شعر 200 مل', company: 'P&G', category: 'بلسم', price: 60, oldPrice: 69, unit: '200 مل', sales: 240, views: 430, stock: 58, type: 'bottle', tone: '#ff708c' },
  { id: 110, title: 'غسول نيفيا 100 مل', company: 'NIVEA', category: 'غسول', price: 78, oldPrice: 88, unit: '100 مل', sales: 175, views: 290, stock: 47, type: 'tube', tone: '#cfe0ef' },
  { id: 111, title: 'شامبو لوريال صيانة 250 مل', company: 'L’ORÉAL PARIS', category: 'شامبوهات', price: 145, oldPrice: 159, unit: '250 مل', sales: 130, views: 222, stock: 24, type: 'bottle', tone: '#f47d37' },
  { id: 112, title: 'كريم نيفيا للجسم 200 مل', company: 'NIVEA', category: 'كريمات', price: 125, oldPrice: 139, unit: '200 مل', sales: 142, views: 248, stock: 31, type: 'jar', tone: '#1f56a6' },
];

const dailyDeals = [
  { id: 201, title: 'عرض شامبو لوريال', discount: 15, price: 100, before: 120, expiresIn: 6, type: 'bottle', tone: '#e45e96' },
  { id: 202, title: 'عرض دوف شامبو', discount: 10, price: 121, before: 135, expiresIn: 5, type: 'bottle', tone: '#e8f0fa' },
  { id: 203, title: 'عرض كريم نيفيا', discount: 20, price: 88, before: 110, expiresIn: 4, type: 'jar', tone: '#103d89' },
  { id: 204, title: 'عرض رول اون نيفيا', discount: 5, price: 76, before: 80, expiresIn: 8, type: 'roll', tone: '#dfeaf3' },
];

let state = {
  route: parseRoute(),
  theme: localStorage.getItem(STORAGE.theme) || 'gold',
  session: loadJSON(STORAGE.session, null),
  selectedTier: loadJSON(STORAGE.tier, null),
  cart: loadJSON(STORAGE.cart, []),
  search: localStorage.getItem(STORAGE.search) || '',
  flashEnds: Number(localStorage.getItem(STORAGE.flashEnds) || 0),
  tierSeen: localStorage.getItem(STORAGE.tierSeen) === '1',
  activeCategory: 'الكل',
  activeSmartGroup: null,
  pendingProduct: null,
  selectedDealMode: false,
};

if (!state.flashEnds || state.flashEnds < Date.now() - 1000) {
  state.flashEnds = Date.now() + 1000 * 60 * 60 * 6;
  localStorage.setItem(STORAGE.flashEnds, String(state.flashEnds));
}

const els = {
  appHeader: document.getElementById('appHeader'),
  heroSlot: document.getElementById('heroSlot'),
  themeSwitcher: document.getElementById('themeSwitcher'),
  tierActionBtn: document.getElementById('tierActionBtn'),
  loginBtn: document.getElementById('loginBtn'),
  loginBtnLabel: document.getElementById('loginBtnLabel'),
  accountNavLabel: document.getElementById('accountNavLabel'),
  stickyBar: document.getElementById('stickyBar'),
  searchBox: document.getElementById('searchBox'),
  searchInput: document.getElementById('searchInput'),
  cartSummaryBtn: document.getElementById('cartSummaryBtn'),
  cartTotalValue: document.getElementById('cartTotalValue'),
  cartBadge: document.getElementById('cartBadge'),
  mainContent: document.getElementById('mainContent'),
  footerBtns: [...document.querySelectorAll('.footer-btn')],
  tierModal: document.getElementById('tierModal'),
  tierModalList: document.getElementById('tierModalList'),
  loginModal: document.getElementById('loginModal'),
  accountModal: document.getElementById('accountModal'),
  accountModalBody: document.getElementById('accountModalBody'),
  accountModalTitle: document.getElementById('accountModalTitle'),
  productModal: document.getElementById('productModal'),
  productModalTitle: document.getElementById('productModalTitle'),
  productModalBody: document.getElementById('productModalBody'),
  productAddBtn: document.getElementById('productAddBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  drawerTotal: document.getElementById('drawerTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  saveCartBtn: document.getElementById('saveCartBtn'),
  toast: document.getElementById('toast'),
  loginName: document.getElementById('loginName'),
  loginPass: document.getElementById('loginPass'),
  loginRole: document.getElementById('loginRole'),
};

const icon = {
  plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v14h-2zM5 11h14v2H5z"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M12 3 3 7v10l9 4 9-4V7l-9-4Zm0 2.2L17.7 8 12 10.8 6.3 8 12 5.2ZM5 8.7l6 3V18l-6-2.7V8.7Zm14 0v6.6L13 18v-6.3l6-3Z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.5-2-3.5-2.4.8a7.9 7.9 0 0 0-2.6-1.5L14 2h-4l-.4 2.8A7.9 7.9 0 0 0 7 6.3L4.6 5.5l-2 3.5 2 1.5a7.8 7.8 0 0 0 0 3l-2 1.5 2 3.5 2.4-.8c.8.6 1.7 1.1 2.6 1.5L10 22h4l.4-2.8c.9-.4 1.8-.9 2.6-1.5l2.4.8 2-3.5-2-1.5ZM12 15.2A3.2 3.2 0 1 1 15.2 12 3.2 3.2 0 0 1 12 15.2Z"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4 4h2.2l2.1 10.5A2 2 0 0 0 10.3 16h8.8v-2h-8.8L10 11h9.6l1.4-7H7.2L6.8 2H4Z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M10.5 3a7.5 7.5 0 1 0 4.72 13.34l4.22 4.22 1.42-1.42-4.22-4.22A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"/></svg>',
  medal: '<svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm0 3 1.6 3.3 3.7.5-2.7 2.6.6 3.7L12 13.3l-3.2 1.8.6-3.7-2.7-2.6 3.7-.5Z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6H9.5v6H5a1 1 0 0 1-1-1Z"/></svg>',
};

function parseRoute(){
  const hash = location.hash.replace('#','').trim();
  return hash || 'home';
}

function loadJSON(key, fallback){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function fmtMoney(value){ return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)) + ' ج.م'; }
function escapeHtml(str){ return String(str).replace(/[&<>"]/g, s => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[s])); }
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function makeSVGData(svg){ return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`; }
function avatarSvg(label, color){
  return makeSVGData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity=".12"/>
      </linearGradient>
    </defs>
    <rect width="180" height="180" rx="36" fill="url(#g)"/>
    <circle cx="90" cy="90" r="62" fill="rgba(255,255,255,.12)"/>
    <text x="90" y="104" font-size="40" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-weight="700">${escapeHtml(label)}</text>
  </svg>`);
}
function productArt(type, tone){
  const bg = tone;
  const inner = {
    bottle: '<rect x="78" y="18" width="44" height="20" rx="8" fill="#f6f6f6" opacity=".8"/><rect x="60" y="38" width="80" height="102" rx="22" fill="#fff" opacity=".92"/><rect x="71" y="50" width="58" height="60" rx="14" fill="rgba(30,52,100,.08)"/>',
    jar: '<ellipse cx="100" cy="58" rx="48" ry="16" fill="rgba(255,255,255,.92)"/><rect x="54" y="58" width="92" height="58" rx="20" fill="#fff"/><ellipse cx="100" cy="116" rx="48" ry="16" fill="rgba(10,20,40,.12)"/>',
    roll: '<rect x="74" y="26" width="52" height="18" rx="9" fill="#fff"/><rect x="62" y="44" width="76" height="92" rx="24" fill="#fefefe"/><circle cx="100" cy="86" r="22" fill="rgba(22,36,72,.08)"/>',
    spray: '<rect x="79" y="22" width="42" height="18" rx="8" fill="#fff"/><rect x="68" y="38" width="64" height="102" rx="18" fill="#fff"/><rect x="76" y="56" width="48" height="56" rx="10" fill="rgba(22,36,72,.08)"/>',
    box: '<rect x="52" y="46" width="96" height="70" rx="16" fill="#fff"/><path d="M52 58h96" stroke="rgba(30,50,88,.14)" stroke-width="4"/><path d="M100 46v70" stroke="rgba(30,50,88,.14)" stroke-width="4"/>',
    tube: '<rect x="72" y="26" width="56" height="104" rx="22" fill="#fff"/><rect x="74" y="52" width="52" height="48" rx="16" fill="rgba(22,36,72,.08)"/>',
  }[type] || '<rect x="64" y="28" width="72" height="100" rx="22" fill="#fff"/>';
  return makeSVGData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#0f1d3c"/>
      </linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".15"/></filter>
    </defs>
    <rect width="220" height="220" rx="34" fill="url(#bg)"/>
    <circle cx="110" cy="110" r="84" fill="rgba(255,255,255,.08)"/>
    <g filter="url(#shadow)" transform="translate(10 10)">${inner}</g>
  </svg>`);
}
function clockArt(){
  return makeSVGData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="480" viewBox="0 0 600 480">
    <defs>
      <radialGradient id="g1" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#f5d37e" stop-opacity=".45"/>
        <stop offset="60%" stop-color="#f5d37e" stop-opacity=".1"/>
        <stop offset="100%" stop-color="#f5d37e" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="480" rx="34" fill="#0b1736"/>
    <circle cx="174" cy="186" r="126" fill="url(#g1)"/>
    <circle cx="174" cy="186" r="104" fill="none" stroke="#f2c35b" stroke-width="8"/>
    <circle cx="174" cy="186" r="84" fill="rgba(255,255,255,.02)" stroke="#3758a7" stroke-width="2"/>
    <line x1="174" y1="186" x2="174" y2="132" stroke="#f2c35b" stroke-width="6" stroke-linecap="round"/>
    <line x1="174" y1="186" x2="214" y2="206" stroke="#f2c35b" stroke-width="6" stroke-linecap="round"/>
    <circle cx="174" cy="186" r="6" fill="#f2c35b"/>
    <rect x="112" y="52" width="124" height="36" rx="18" fill="rgba(255,255,255,.04)"/>
    <rect x="478" y="38" width="92" height="92" rx="28" fill="rgba(255,255,255,.05)"/>
    <rect x="410" y="326" width="138" height="26" rx="13" fill="rgba(255,255,255,.04)"/>
  </svg>`);
}
function medalArt(){
  return makeSVGData(`
  <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef2f9"/>
        <stop offset="100%" stop-color="#cfd8ea"/>
      </linearGradient>
    </defs>
    <circle cx="90" cy="90" r="72" fill="url(#g)" stroke="#b7c4d9" stroke-width="3"/>
    <path d="M90 43 98 70l28 2-22 17 8 27-22-15-22 15 8-27-22-17 28-2z" fill="#9aa6b8"/>
  </svg>`);
}

function setTheme(themeKey){
  state.theme = themeKey;
  document.body.setAttribute('data-theme', themeKey);
  localStorage.setItem(STORAGE.theme, themeKey);
  renderThemeSwitcher();
}

function buildThemeSwitcher(){
  els.themeSwitcher.innerHTML = themes.map(t => `
    <button class="theme-chip ${state.theme === t.key ? 'active' : ''}" data-theme="${t.key}" type="button">
      <span class="theme-icon" style="background:${t.color}"></span>
      <span>${t.label}</span>
    </button>
  `).join('');
}

function tierById(id){ return tiers.find(t => t.id === id) || null; }
function activeTier(){ return tierById(state.selectedTier) || tiers[0]; }
function isFlashActive(){ return state.flashEnds > Date.now(); }
function flashRemaining(){ return Math.max(0, state.flashEnds - Date.now()); }
function flashParts(){ const s = Math.floor(flashRemaining()/1000); const h = String(Math.floor(s/3600)).padStart(2,'0'); const m = String(Math.floor(s%3600/60)).padStart(2,'0'); const sec = String(s%60).padStart(2,'0'); return {h,m,sec}; }

function heroMarkup(){
  if (isFlashActive()) {
    const t = flashParts();
    return `
      <article class="hero-card">
        <div class="hero-illustration" aria-hidden="true">
          <div class="clock-art"><div class="clock-core"><span class="clock-ring"></span><span class="clock-dots"></span></div></div>
        </div>
        <div class="hero-copy">
          <p class="hero-kicker">عرض الساعة</p>
          <h1 class="hero-title">عرض الساعة</h1>
          <div class="countdown-grid mono" id="flashCountdown">
            <div class="count-block"><span class="count-number">${t.h}</span><span class="count-label">ساعة</span></div>
            <div class="count-block"><span class="count-number">${t.m}</span><span class="count-label">دقيقة</span></div>
            <div class="count-block"><span class="count-number">${t.sec}</span><span class="count-label">ثانية</span></div>
          </div>
          <p class="hero-note">متبقي على انتهاء العرض</p>
          <button class="hero-cta" data-action="flash">${icon.play} شاهد العروض الحالية</button>
        </div>
      </article>
    `;
  }
  const t = activeTier();
  const achieved = Math.max(Number(t.min), totalCartValue());
  const progress = clamp(Math.round((achieved / t.target) * 100), 0, 100);
  const remaining = Math.max(0, t.target - achieved);
  return `
    <article class="tier-hero-card">
      <div class="tier-hero-head">
        <div>
          <p class="tier-kicker">أنت الآن على شريحة</p>
          <h1 class="tier-title">${t.name}</h1>
        </div>
        <div class="tier-medal" aria-hidden="true">${medalArt()}</div>
      </div>
      <div class="progress-track" aria-label="شريط التقدم"><div class="progress-fill" style="width:${progress}%"></div><span class="progress-tag">%${progress}</span></div>
      <div class="tier-stats">
        <div class="stat-card"><span>ما تم تحقيقه</span><strong class="positive">${fmtMoney(achieved)}</strong></div>
        <div class="stat-card"><span>المتبقي لتحقيق الشريحة</span><strong class="negative">${fmtMoney(remaining)}</strong></div>
      </div>
      <p class="hero-note">${t.desc}</p>
    </article>
  `;
}

function totalCartValue(){
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}
function cartCount(){ return state.cart.reduce((sum, item) => sum + item.qty, 0); }
function updateCartBadges(){
  const total = totalCartValue();
  const count = cartCount();
  els.cartTotalValue.textContent = fmtMoney(total);
  els.drawerTotal.textContent = fmtMoney(total);
  els.cartBadge.textContent = String(count);
  els.tierActionBtn.textContent = state.selectedTier ? tierById(state.selectedTier)?.name || 'الشريحة' : 'اختار شريحتك';
  els.loginBtnLabel.textContent = state.session ? 'حسابي' : 'تسجيل الدخول';
  els.accountNavLabel.textContent = state.session ? 'حسابي' : 'تسجيل الدخول';
}

function renderThemeSwitcher(){ buildThemeSwitcher(); }

function renderHeader(){
  els.heroSlot.innerHTML = heroMarkup();
  updateCartBadges();
  renderThemeSwitcher();
  if (els.searchInput) els.searchInput.value = state.search;
}

function renderHome(){
  const q = state.search.trim().toLowerCase();
  const filtered = !q ? products : products.filter(p => [p.title, p.company, p.category].join(' ').toLowerCase().includes(q));
  const topViewed = [...filtered].sort((a,b)=>b.views-a.views).slice(0, 8);
  const topSales = [...filtered].sort((a,b)=>b.sales-a.sales).slice(0, 8);
  const recommended = [...filtered].sort((a,b)=>(b.sales+b.views)-(a.sales+a.views)).slice(0, 8);
  const smartGroups = buildSmartGroups(filtered);
  els.mainContent.innerHTML = `
    <section class="section">
      <div class="section-head"><h2>الأقسام</h2><button class="more-link" data-action="sections">عرض الكل</button></div>
      <div class="category-grid">
        ${categoryCard('الشركات', 'متابعة أسماء الموردين والمتاح حاليًا.', 'companies')}
        ${categoryCard('الأكثر مبيعًا', 'ترتيب ذكي حسب البيع الأعلى.', 'sales')}
        ${categoryCard('الأكثر طلبًا', 'الأصناف الأكثر مشاهدة وطلبًا.', 'views')}
        ${categoryCard('تصفح المنتجات حسب الأصناف', 'فلترة ذكية وتجميع تلقائي من أسماء المنتجات.', 'smart')}
      </div>
    </section>

    <section class="section" id="companiesSection">
      <div class="section-head"><h2>الشركات المتاحة</h2><button class="more-link" data-action="companies">عرض الكل</button></div>
      <div class="brand-strip">${companies.map(c => `
        <button class="brand-card" data-company="${escapeHtml(c.name)}" type="button">
          <span class="brand-logo" style="background:linear-gradient(135deg, ${c.color}, color-mix(in srgb, ${c.color} 20%, #ffffff))">${escapeHtml(c.short)}</span>
          <span>${escapeHtml(c.name)}</span>
        </button>`).join('')}
      </div>
    </section>

    <section class="section" id="smartSection">
      <div class="section-head"><h2>تصفح المنتجات حسب الأصناف</h2><button class="more-link" data-action="smart">فلترة ذكية</button></div>
      <div class="smart-panel">
        <div class="smart-chips">${smartGroups.map(g => `<button class="smart-chip ${state.activeSmartGroup===g.label ? 'active':''}" data-smart="${escapeHtml(g.label)}" type="button">${escapeHtml(g.label)} (${g.items.length})</button>`).join('')}</div>
        <div class="compact-grid">
          ${smartPreviewCards(smartGroups, state.activeSmartGroup || smartGroups[0]?.label)}
        </div>
      </div>
    </section>

    <section class="section" id="recommendedSection">
      <div class="section-head"><h2>منتجات موصى بها</h2><button class="more-link" data-action="recommended">عرض الكل</button></div>
      <div class="compact-grid">${renderProductCards(recommended)}</div>
    </section>

    <section class="section" id="viewedSection">
      <div class="section-head"><h2>الأكثر مشاهدة</h2><button class="more-link" data-action="views">عرض الكل</button></div>
      <div class="compact-grid">${renderProductCards(topViewed)}</div>
    </section>

    <section class="section" id="soldSection">
      <div class="section-head"><h2>الأكثر مبيعًا</h2><button class="more-link" data-action="sales">عرض الكل</button></div>
      <div class="compact-grid">${renderProductCards(topSales)}</div>
    </section>

    <section class="section" id="suggestionsSection">
      <div class="section-head"><h2>مقترحات تناسب سلتك</h2><span class="muted">حسب إجمالي مشترياتك الحالية</span></div>
      <div class="compact-grid">${renderSuggestions()}</div>
    </section>
  `;
}

function categoryCard(title, desc, kind){
  const art = {
    companies: companyArt(),
    sales: salesArt(),
    views: viewsArt(),
    smart: smartArt(),
  }[kind];
  return `
    <button class="category-card" data-action="${kind}" type="button">
      <div class="category-art">${art}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </button>
  `;
}

function companyArt(){
  return `<svg viewBox="0 0 120 120"><rect x="22" y="22" width="76" height="76" rx="18" fill="#f1f5fb" stroke="#d8e0ed"/><path d="M34 76h52V42H34Z" fill="#95a5bd" opacity=".18"/><path d="M42 84h36V34H42Z" fill="#20345f" opacity=".08"/><path d="M38 74 52 60l10 9 20-20" fill="none" stroke="#1ea36b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function salesArt(){
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="36" fill="#eaf4ff"/><path d="M30 72 48 54l14 12 24-28" fill="none" stroke="#23a166" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M76 30h22v22" fill="none" stroke="#23a166" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function viewsArt(){
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="34" fill="#f7f2ff"/><path d="M60 34c18 0 33 11 42 26-9 15-24 26-42 26S27 75 18 60c9-15 24-26 42-26Z" fill="#6e50d8" opacity=".15"/><circle cx="60" cy="60" r="12" fill="#6e50d8"/><circle cx="60" cy="60" r="4" fill="#fff"/></svg>`;
}
function smartArt(){
  return `<svg viewBox="0 0 120 120"><rect x="20" y="24" width="80" height="72" rx="18" fill="#eef4fb"/><rect x="30" y="36" width="56" height="10" rx="5" fill="#2f7cff" opacity=".35"/><rect x="30" y="54" width="44" height="10" rx="5" fill="#1ea36b" opacity=".35"/><rect x="30" y="72" width="30" height="10" rx="5" fill="#d43b40" opacity=".35"/></svg>`;
}

function buildSmartGroups(list){
  const rules = [
    { label: 'شامبوهات', match: /(شامبو|shampoo|شامبوهات)/i },
    { label: 'كريمات', match: /(كريم|cream|كريمات)/i },
    { label: 'رول أون', match: /(رول|roll|رول\s?أون|رول اون)/i },
    { label: 'اسبراي', match: /(اسبراي|spray|سبراي)/i },
    { label: 'صبغات', match: /(صبغة|صبغات|dye|hair color)/i },
    { label: 'غسول', match: /(غسول|wash|cleanser)/i },
    { label: 'بلسم', match: /(بلسم|conditioner)/i },
  ];
  const map = new Map(rules.map(r => [r.label, []]));
  const remainder = [];
  for (const p of list){
    const rule = rules.find(r => r.match.test(p.title));
    if (rule) map.get(rule.label).push(p); else remainder.push(p);
  }
  const groups = [];
  for (const rule of rules){
    if (map.get(rule.label).length) groups.push({ label: rule.label, items: map.get(rule.label) });
  }
  if (remainder.length) groups.push({ label: 'أخرى', items: remainder });
  return groups;
}

function smartPreviewCards(groups, active){
  const group = groups.find(g => g.label === active) || groups[0];
  if (!group) return `<div class="empty-state">لا توجد نتائج.</div>`;
  return group.items.slice(0, 4).map(productCard).join('') || `<div class="empty-state">لا توجد منتجات ضمن هذا الصنف.</div>`;
}

function renderProductCards(list){
  return list.slice(0, 8).map(productCard).join('');
}
function productCard(p){
  return `
    <article class="item-card">
      <div class="item-art"><img alt="${escapeHtml(p.title)}" src="${productArt(p.type, p.tone)}"></div>
      <div class="item-body">
        <p class="item-title">${escapeHtml(p.title)}</p>
        <p class="item-meta">${escapeHtml(p.company)} • ${escapeHtml(p.unit)}</p>
        <div class="item-actions">
          <strong class="price-tag">${fmtMoney(p.price)}</strong>
          <button class="add-btn" data-add="${p.id}" type="button" aria-label="إضافة">
            ${icon.plus}
          </button>
        </div>
      </div>
    </article>`;
}

function renderSuggestions(){
  const total = totalCartValue();
  const bucket = total > 10000 ? 'premium' : total > 5000 ? 'middle' : 'entry';
  const sorted = [...products].sort((a,b) => (b.sales + b.views) - (a.sales + a.views));
  let pick = [];
  if (bucket === 'premium') pick = sorted.filter(p => /كريم|غسول|شامبو/.test(p.category)).slice(0, 4);
  else if (bucket === 'middle') pick = sorted.filter(p => /رول أون|اسبراي|صبغات/.test(p.category) || /شامبو/.test(p.category)).slice(0, 4);
  else pick = sorted.slice(0, 4);
  return pick.map(productCard).join('');
}

function renderDeals(){
  const active = isFlashActive();
  els.mainContent.innerHTML = `
    <section class="section">
      <div class="section-head"><h2>عرض الساعة</h2><span class="muted">${active ? 'ساري الآن' : 'انتهى العرض'}</span></div>
      <div class="panel-card">
        <div class="panel-head"><h3>${active ? 'العروض الحالية' : 'العروض المنتهية'} </h3><span class="muted">${active ? 'يُحدّث تلقائيًا' : 'أرشيف العروض'}</span></div>
        <div class="stack-grid">${dailyDeals.map(d => `
          <article class="list-card">
            <div class="list-meta"><h3>${escapeHtml(d.title)}</h3><strong class="price-tag">-${d.discount}%</strong></div>
            <p>كان ${fmtMoney(d.before)} والآن ${fmtMoney(d.price)} • متبقي ${d.expiresIn} ساعات</p>
            <div class="progress-line"><span style="width:${d.discount * 5}%"></span></div>
            <div class="modal-actions"><button class="ghost-btn" data-add="${d.id}" data-deal="1" type="button">إضافة للسلة</button><button class="ghost-btn" data-open-product="${d.id}" type="button">تفاصيل</button></div>
          </article>`).join('')}</div>
      </div>
    </section>
  `;
}

function renderTiers(){
  els.mainContent.innerHTML = `
    <section class="section">
      <div class="section-head"><h2>الشرائح</h2><span class="muted">اختر شريحتك لتفعيل السعر المناسب</span></div>
      <div class="stack-grid">${tiers.map(t => {
        const active = state.selectedTier === t.id;
        return `
          <article class="list-card ${active ? 'active' : ''}">
            <div class="list-meta"><h3>${t.name}</h3><strong>${t.badge}</strong></div>
            <p>${t.desc}</p>
            <p>الحد الأدنى ${fmtMoney(t.min)} • الهدف ${fmtMoney(t.target)}</p>
            <button class="primary-btn" data-select-tier="${t.id}" type="button">${active ? 'الشريحة الحالية' : 'اختيار الشريحة'}</button>
          </article>
        `;
      }).join('')}</div>
    </section>
  `;
}

function renderAccount(){
  const user = state.session;
  if (!user){
    els.mainContent.innerHTML = `
      <section class="section">
        <div class="panel-card">
          <h2 style="margin:0;font-size:1rem">تسجيل الدخول</h2>
          <p class="muted" style="margin:0;line-height:1.8;font-size:.84rem">الوصول إلى الحساب، العملاء، والفواتير متاح بعد تسجيل الدخول.</p>
          <button class="primary-btn" data-action="open-login" type="button">تسجيل الدخول</button>
        </div>
      </section>`;
    return;
  }
  const isRep = user.role === 'rep';
  els.mainContent.innerHTML = `
    <section class="section">
      <div class="panel-card">
        <div class="panel-head"><h3>حسابي</h3><span class="status-pill">${isRep ? 'مندوب' : 'عميل'}</span></div>
        <div class="feature-list">
          <div class="feature-card"><h4>${escapeHtml(user.name)}</h4><p>الحساب مسجل ومفعل على النظام.</p></div>
          <div class="feature-card"><h4>${state.selectedTier ? tierById(state.selectedTier)?.name : 'لم يتم اختيار شريحة'}</h4><p>تأثير التسعير على كامل السلة.</p></div>
        </div>
        ${isRep ? `
          <div class="stack-grid">
            <button class="primary-btn" data-action="show-customers" type="button">عرض العملاء</button>
            <button class="ghost-btn" data-action="add-customer" type="button">إضافة عميل</button>
            <button class="ghost-btn" data-action="show-invoices" type="button">عرض فواتيري</button>
          </div>
        ` : ''}
        <button class="ghost-btn" data-action="logout" type="button">تسجيل الخروج</button>
      </div>
    </section>`;
}

function renderQuick(){
  const q = state.search.trim().toLowerCase();
  const freq = [...products].sort((a,b) => (b.sales + b.views) - (a.sales + a.views)).slice(0, 6);
  const hit = q ? products.filter(p => [p.title, p.company, p.category].join(' ').toLowerCase().includes(q)) : freq;
  els.mainContent.innerHTML = `
    <section class="section">
      <div class="section-head"><h2>التسوق السريع</h2><span class="muted">الأصناف الأسرع دورانًا</span></div>
      <div class="compact-grid">${renderProductCards(hit)}</div>
    </section>`;
}

function renderPage(){
  state.route = parseRoute();
  document.body.classList.toggle('is-home', state.route === 'home');
  if (state.route === 'home') renderHome();
  else if (state.route === 'tiers') renderTiers();
  else if (state.route === 'offers') renderDeals();
  else if (state.route === 'account') renderAccount();
  else if (state.route === 'quick') renderQuick();
  else renderHome();
  setFooterActive();
  setHeaderCondensed();
  renderHeader();
}

function setFooterActive(){
  els.footerBtns.forEach(btn => btn.classList.toggle('is-active', btn.dataset.route === `#${state.route}`));
}

function setHeaderCondensed(){
  const condensed = state.route !== 'home' || window.scrollY > 90;
  els.appHeader.classList.toggle('header-condensed', condensed);
}

function notify(title, text=''){
  const node = document.createElement('div');
  node.className = 'notify';
  node.innerHTML = `<div><strong>${escapeHtml(title)}</strong>${text ? `<span>${escapeHtml(text)}</span>` : ''}</div><button class="icon-btn" type="button" aria-label="إغلاق">×</button>`;
  node.querySelector('button').addEventListener('click', () => hideNotify(node));
  els.toast.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => hideNotify(node), 2600);
}
function hideNotify(node){
  if (!node || !node.isConnected) return;
  node.classList.remove('is-visible');
  setTimeout(() => node.remove(), 250);
}

function openOverlay(el){ el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
function closeOverlay(el){ el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }

function openTierModal(){
  els.tierModalList.innerHTML = tiers.map(t => `
    <button class="tier-card-btn ${state.selectedTier === t.id ? 'active' : ''}" data-select-tier="${t.id}" type="button">
      <strong>${t.name}</strong>
      <span>${t.desc}</span>
      <span>الحد الأدنى ${fmtMoney(t.min)} • الهدف ${fmtMoney(t.target)}</span>
    </button>
  `).join('');
  openOverlay(els.tierModal);
}

function openLoginModal(){
  openOverlay(els.loginModal);
}

function openProductModal(item){
  state.pendingProduct = item;
  els.productModalTitle.textContent = item.title;
  const company = item.company || 'عرض الساعة';
  const category = item.category || 'عرض';
  const unit = item.unit || '—';
  els.productModalBody.innerHTML = `
    <div class="feature-list">
      <div class="feature-card"><img src="${productArt(item.type, item.tone)}" alt="${escapeHtml(item.title)}"></div>
      <div class="feature-card">
        <h4>${escapeHtml(company)}</h4>
        <p>${escapeHtml(category)} • ${escapeHtml(unit)}</p>
        <p>السعر ${fmtMoney(item.price)} • قبلها ${fmtMoney(item.oldPrice)}</p>
        <p>المخزون ${item.stock ?? '—'} • المبيعات ${item.sales ?? '—'}</p>
      </div>
    </div>
  `;
  openOverlay(els.productModal);
}

function openCartDrawer(){
  renderCartItems();
  openOverlay(els.cartDrawer);
}

function renderCartItems(){
  if (!state.cart.length){
    els.cartItems.innerHTML = '<div class="empty-state">السلة فارغة حاليًا.</div>';
    return;
  }
  els.cartItems.innerHTML = state.cart.map(item => `
    <article class="cart-item">
      <img src="${productArt(item.type, item.tone)}" alt="${escapeHtml(item.title)}">
      <div>
        <p class="cart-title">${escapeHtml(item.title)}</p>
        <p class="cart-sub">${escapeHtml(item.company)} • ${escapeHtml(item.unit)}</p>
        <div class="cart-line">
          <strong>${fmtMoney(item.price * item.qty)}</strong>
          <div class="qty">
            <button data-qty="dec" data-id="${item.id}" type="button">-</button>
            <input value="${item.qty}" readonly>
            <button data-qty="inc" data-id="${item.id}" type="button">+</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function addToCartById(id, isDeal = false){
  const source = isDeal ? dailyDeals.find(d => d.id === Number(id)) : products.find(p => p.id === Number(id));
  if (!source) return;
  if (!state.selectedTier && !state.tierSeen){
    state.pendingProduct = source;
    notify('يجب أن تختار شريحتك أولًا', 'قبل أول إضافة للسلة.');
    openTierModal();
    return;
  }
  const item = {
    id: source.id,
    title: source.title,
    company: source.company || 'عرض الساعة',
    category: source.category || 'عرض',
    unit: source.unit || '1',
    price: source.price,
    oldPrice: source.oldPrice || source.before || source.price,
    qty: 1,
    type: source.type || 'box',
    tone: source.tone || '#1d3d8f',
  };
  const found = state.cart.find(c => c.id === item.id);
  if (found) found.qty += 1;
  else state.cart.push(item);
  saveJSON(STORAGE.cart, state.cart);
  notify('تمت الإضافة إلى السلة', item.title);
  renderHeader();
  if (state.route === 'home') renderHome();
}

function selectTier(id){
  state.selectedTier = id;
  state.tierSeen = true;
  localStorage.setItem(STORAGE.tierSeen, '1');
  saveJSON(STORAGE.tier, id);
  closeOverlay(els.tierModal);
  renderHeader();
  renderPage();
  notify('تم اختيار الشريحة', tierById(id)?.name || '');
  if (state.pendingProduct){
    const p = state.pendingProduct;
    state.pendingProduct = null;
    setTimeout(() => addToCartById(p.id, Boolean(p.before)), 0);
  }
}

function login(){
  const name = els.loginName.value.trim();
  const pass = els.loginPass.value.trim();
  const role = els.loginRole.value;
  if (!name || !pass){
    notify('الرجاء إدخال بيانات الدخول', 'الاسم وكلمة المرور مطلوبان.');
    return;
  }
  state.session = { name, role };
  saveJSON(STORAGE.session, state.session);
  closeOverlay(els.loginModal);
  renderHeader();
  renderPage();
  notify('تم تسجيل الدخول', role === 'rep' ? 'مندوب' : 'عميل');
}

function logout(){
  state.session = null;
  localStorage.removeItem(STORAGE.session);
  renderHeader();
  renderPage();
  notify('تم تسجيل الخروج');
}

function updateQty(id, dir){
  const item = state.cart.find(x => x.id === Number(id));
  if (!item) return;
  item.qty += dir === 'inc' ? 1 : -1;
  if (item.qty <= 0) state.cart = state.cart.filter(x => x.id !== item.id);
  saveJSON(STORAGE.cart, state.cart);
  renderCartItems();
  renderHeader();
  if (state.route === 'home') renderHome();
}

function checkout(){
  if (!state.selectedTier && !state.tierSeen){
    notify('يجب أن تختار شريحتك أولًا', 'قبل إتمام الشراء.');
    openTierModal();
    return;
  }
  if (!state.cart.length){
    notify('السلة فارغة', 'أضف منتجات أولًا.');
    return;
  }
  notify('تم تجهيز الطلب', 'يمكن متابعة الإنهاء أو الحفظ.');
  closeOverlay(els.cartDrawer);
}

function saveCart(){
  saveJSON(STORAGE.cart, state.cart);
  notify('تم حفظ السلة');
}

function openAccount(){
  const user = state.session;
  els.accountModalTitle.textContent = user ? 'حسابي' : 'تسجيل الدخول';
  if (!user){
    els.accountModalBody.innerHTML = `<div class="panel-card"><p class="muted" style="margin:0;line-height:1.8">لا يوجد حساب مسجل حاليًا.</p><button class="primary-btn" data-action="open-login" type="button">تسجيل الدخول</button></div>`;
  } else {
    const repActions = user.role === 'rep' ? `
      <div class="stack-grid">
        <button class="primary-btn" data-action="show-customers" type="button">عرض العملاء</button>
        <button class="ghost-btn" data-action="add-customer" type="button">إضافة عميل</button>
        <button class="ghost-btn" data-action="show-invoices" type="button">عرض فواتيري</button>
      </div>` : '';
    els.accountModalBody.innerHTML = `
      <div class="panel-card">
        <div class="panel-head"><h3>${escapeHtml(user.name)}</h3><span class="status-pill">${user.role === 'rep' ? 'مندوب' : 'عميل'}</span></div>
        <p class="muted" style="margin:0;line-height:1.75">${state.selectedTier ? `الشريحة الحالية: ${tierById(state.selectedTier)?.name}` : 'لا توجد شريحة مختارة.'}</p>
        ${repActions}
        <button class="ghost-btn" data-action="logout" type="button">تسجيل الخروج</button>
      </div>`;
  }
  openOverlay(els.accountModal);
}

function scrollToSection(selector){
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function syncSearch(value){
  state.search = value;
  localStorage.setItem(STORAGE.search, value);
  renderHeader();
  if (state.route === 'home') renderHome();
  else if (state.route === 'quick') renderQuick();
}

function highlightSmartGroup(label){
  state.activeSmartGroup = label;
  if (state.route === 'home') renderHome();
}

function handleTopAction(action){
  if (action === 'companies') scrollToSection('#companiesSection');
  else if (action === 'deals' || action === 'flash') location.hash = '#offers';
  else if (action === 'sections') scrollToSection('#companiesSection');
  else if (action === 'smart') scrollToSection('#smartSection');
  else if (action === 'open-tier') openTierModal();
  else if (action === 'open-login') openLoginModal();
  else if (action === 'show-customers') notify('عرض العملاء', 'مخصص للمندوب فقط');
  else if (action === 'add-customer') notify('إضافة عميل', 'مخصص للمندوب فقط');
  else if (action === 'show-invoices') notify('عرض الفواتير', 'مخصص للمندوب فقط');
  else if (action === 'call') window.open('tel:+201040880002', '_self');
  else if (action === 'whatsapp') window.open(`https://wa.me/${encodeURIComponent('201040880002')}`, '_blank');
  else if (action === 'facebook') notify('فيس بوك', 'اربط قناة التواصل هنا');
  else if (action === 'support') notify('الدعم', 'سيتم فتح قناة الدعم');
}

function init(){
  document.body.setAttribute('data-theme', state.theme);
  renderHeader();
  renderPage();
  buildThemeSwitcher();

  document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const action = target.dataset.action;
    const route = target.dataset.route;
    const add = target.dataset.add;
    const openProduct = target.dataset.openProduct;
    const selectTierId = target.dataset.selectTier;
    const smart = target.dataset.smart;
    const qty = target.dataset.qty;
    const id = target.dataset.id;
    const theme = target.dataset.theme;
    const close = target.dataset.close;
    const deal = target.dataset.deal;

    if (theme){ setTheme(theme); return; }
    if (route){ location.hash = route; return; }
    if (close){ closeOverlay(document.getElementById(close)); return; }
    if (action){ handleTopAction(action); return; }
    if (add){ addToCartById(add, deal === '1'); return; }
    if (openProduct){ openProductModal(dailyDeals.find(d => d.id === Number(openProduct)) || products.find(p => p.id === Number(openProduct))); return; }
    if (selectTierId){ selectTier(selectTierId); return; }
    if (smart){ highlightSmartGroup(smart); return; }
    if (qty && id){ updateQty(id, qty); return; }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'searchInput') syncSearch(e.target.value);
  });

  window.addEventListener('scroll', setHeaderCondensed, { passive:true });
  window.addEventListener('hashchange', () => {
    renderPage();
    if (state.route !== 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  els.loginBtn.addEventListener('click', () => {
    if (state.session) openAccount(); else openLoginModal();
  });
  els.cartSummaryBtn.addEventListener('click', openCartDrawer);
  els.productAddBtn.addEventListener('click', () => {
    const p = state.pendingProduct;
    if (!p) return;
    closeOverlay(els.productModal);
    addToCartById(p.id, Boolean(p.before));
  });
  els.checkoutBtn.addEventListener('click', checkout);
  els.saveCartBtn.addEventListener('click', saveCart);
  els.tierActionBtn.addEventListener('click', openTierModal);

  document.getElementById('submitLoginBtn').addEventListener('click', login);


  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) closeOverlay(overlay);
    });
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    document.querySelectorAll('.overlay').forEach(overlay => closeOverlay(overlay));
    closeOverlay(els.cartDrawer);
  });
  if (!state.session && location.hash === '#account') renderPage();

  setInterval(() => {
    if (isFlashActive()) {
      if (state.route === 'home') {
        const hero = document.getElementById('flashCountdown');
        if (hero) {
          const t = flashParts();
          hero.querySelectorAll('.count-number').forEach((node, i) => node.textContent = [t.h,t.m,t.sec][i]);
        }
      }
    } else if (state.route === 'home') {
      renderHeader();
      renderHome();
    } else {
      renderHeader();
    }
    updateCartBadges();
  }, 1000);
}

init();
