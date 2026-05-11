import { productCard } from '../components/cards.js';
import { getSelectedTier, getVisibleProducts, getVisibleCompanies, normalize } from '../state/selectors.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function recoveryState(message) {
  return `<div class="empty-state empty-state--recovery"><p>${message}</p><button class="btn btn--primary" type="button" data-action="refresh-catalog">تحديث المنتجات والأسعار</button></div>`;
}

export function renderSearchPage(state) {
  const tier = getSelectedTier(state);
  const q = normalize(state.ui.search);
  const products = q ? getVisibleProducts(state) : [];
  const companies = q ? getVisibleCompanies(state) : [];
  const loading = Boolean(state.runtime.loading.catalog || state.runtime.loading.company || !state.app.ready);

  const companyGrid = companies.length
    ? companies.map((company) => `
            <article class="company-card" data-action="open-company" data-company-id="${escapeHtml(company.company_id)}">
              <div class="company-card__logo">${company.company_logo ? `<img src="${escapeHtml(company.company_logo)}" alt="${escapeHtml(company.company_name)}" loading="lazy" />` : `<span>${escapeHtml((company.company_name || '').slice(0, 1) || 'A')}</span>`}</div>
              <h3 class="company-card__title">${escapeHtml(company.company_name || '')}</h3>
              <button class="btn btn--ghost company-card__action" type="button">تصفح المنتجات</button>
            </article>`).join('')
    : recoveryState(loading ? 'جارٍ تحميل الشركات…' : 'لا توجد شركات مطابقة');

  const productGrid = products.length
    ? products.map((product) => productCard(product, tier, { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join('')
    : recoveryState(loading ? 'جارٍ تحميل المنتجات…' : 'لا توجد منتجات مطابقة');

  return `
    <div class="page-stack search-page">
      <section class="page-section search-page__bar">
        <div class="page-section__head page-section__head--tight">
          <div>
            <h2>البحث</h2>
            <p>ابحث عن منتج أو شركة أو قسم</p>
          </div>
          <button class="btn btn--ghost" type="button" data-action="go-back">رجوع</button>
        </div>
        <div class="search-page__input-row">
          <input id="searchInput" data-role="search-input" type="search" placeholder="ابحث باسم المنتج أو الشركة أو القسم" value="${escapeHtml(state.ui.search)}" autocomplete="off" autofocus />
          <button class="btn btn--ghost" type="button" data-action="clear-search">مسح</button>
        </div>
      </section>

      ${q ? `
        <section class="page-section">
          <div class="page-section__head page-section__head--tight"><div><h2>الشركات</h2><p>${companies.length} نتيجة</p></div></div>
          <div class="company-grid">${companyGrid}</div>
        </section>
        <section class="page-section">
          <div class="page-section__head page-section__head--tight"><div><h2>المنتجات</h2><p>${products.length} نتيجة</p></div></div>
          <div class="product-grid">${productGrid}</div>
        </section>
      ` : `
        <section class="page-section">
          <div class="empty-state">ابدأ بالبحث لعرض النتائج</div>
        </section>
      `}
    </div>
  `;
}
