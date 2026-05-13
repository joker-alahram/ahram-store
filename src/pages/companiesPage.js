import { companyCard, productCard } from '../components/cards.js';
import { getSelectedTier, getVisibleCompanies } from '../state/selectors.js';

export function renderCompaniesPage(state) {
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>الشركات</h2><p>شبكة التوريد الرئيسية</p></div></div>
        <div class="company-grid">${getVisibleCompanies(state).map(companyCard).join('')}</div>
      </section>
    </div>
  `;
}

export function renderCompanyPage(state) {
  const companyId = state.app.route.params.companyId;
  const company = state.commerce.catalog.companies.find((item) => String(item.company_id) === String(companyId));
  const tier = getSelectedTier(state);
  const products = Object.values(state.commerce.catalog.productIndex || {}).filter((product) => String(product.company_id) === String(companyId));
  const ready = Boolean(state.runtime.lifecycle?.companyProductsReady || products.length);
  const loading = Boolean(state.runtime.lifecycle?.companyProductsLoading || state.runtime.loading.company === companyId);
  const error = state.runtime.companyErrors?.[companyId] || state.app.lastError;

  const skeleton = Array.from({ length: 4 }).map(() => `
    <article class="product-card is-skeleton" aria-hidden="true">
      <div class="skeleton-box skeleton-box--media"></div>
      <div class="product-card__body">
        <div class="skeleton-box skeleton-box--line"></div>
        <div class="skeleton-box skeleton-box--line short"></div>
        <div class="skeleton-box skeleton-box--line"></div>
      </div>
    </article>
  `).join('');

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
      ${error && !ready ? `<section class="page-section"><div class="empty-state empty-state--error">${String(error)}</div></section>` : ''}
      ${loading && !products.length ? `<section class="product-grid">${skeleton}</section>` : ''}
      ${products.length ? `<section class="product-grid">${products.map((product) => productCard(product, tier, { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === "product" && item.id === product.product_id) })).join('')}</section>` : ''}
      ${ready && !loading && !products.length ? '<section class="page-section"><div class="empty-state">لا توجد منتجات لهذه الشركة</div></section>' : ''}
    </div>
  `;
}
