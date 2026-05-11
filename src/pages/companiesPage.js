import { companyCard, productCard } from '../components/cards.js';
import { getSelectedTier, getVisibleCompanies } from '../state/selectors.js';

function recoveryState(message) {
  return `<div class="empty-state empty-state--recovery"><p>${message}</p><button class="btn btn--primary" type="button" data-action="refresh-catalog">تحديث المنتجات والأسعار</button></div>`;
}

export function renderCompaniesPage(state) {
  const loading = Boolean(state.runtime.loading.catalog || !state.app.ready);
  const companies = getVisibleCompanies(state);
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>الشركات</h2><p>شبكة التوريد الرئيسية</p></div></div>
        <div class="company-grid">${companies.length ? companies.map(companyCard).join('') : recoveryState(loading ? 'جارٍ تحميل الشركات…' : 'لا توجد شركات')}</div>
      </section>
    </div>
  `;
}

export function renderCompanyPage(state) {
  const companyId = state.app.route.params.companyId;
  const company = state.commerce.catalog.companies.find((item) => String(item.company_id) === String(companyId));
  const tier = getSelectedTier(state);
  const loading = state.runtime.loading.company === companyId;
  const error = state.runtime.companyErrors?.[companyId] || state.app.lastError;
  const products = Object.values(state.commerce.catalog.productIndex || {}).filter((product) => String(product.company_id) === String(companyId));

  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>${company ? company.company_name : 'الشركة'}</h2>
            <p>${loading ? 'جارٍ تحميل بيانات الشركة' : 'منتجات الشركة'}</p>
          </div>
        </div>
      </section>
      ${error ? `<section class="page-section"><div class="empty-state empty-state--error">${String(error)}</div></section>` : ''}
      ${loading && !products.length ? '<section class="page-section"><div class="empty-state empty-state--recovery">جارٍ تحميل المنتجات…</div></section>' : ''}
      <section class="product-grid">${products.length ? products.map((product) => productCard(product, tier, { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === "product" && item.id === product.product_id) })).join('') : (!loading ? recoveryState('لا توجد منتجات') : '')}</section>
    </div>
  `;
}
