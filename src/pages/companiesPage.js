import { companyCard, productCard } from '../components/cards.js';
import { getVisibleCompanies, getVisibleProducts } from '../state/selectors.js';

export function renderCompaniesPage(state) {
  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head"><div><h2>الشركات</h2><p>شبكة التوريد الرئيسية</p></div></div>
        <div class="company-grid">${getVisibleCompanies(state).map(companyCard).join('') || '<div class="empty-state">لا توجد شركات</div>'}</div>
      </section>
    </div>
  `;
}

export function renderCompanyPage(state) {
  const companyId = state.app.route.params.companyId;
  const company = state.commerce.catalog.companies.find((item) => String(item.company_id) === String(companyId));
  const products = getVisibleProducts(state, companyId);
  const tier = state.commerce.catalog.tiers.find((t) => t.tier_name === state.commerce.priceBook.tierName) || state.commerce.catalog.tiers[0];

  return `
    <div class="page-stack">
      <section class="page-section">
        <div class="page-section__head">
          <div>
            <h2>${company ? company.company_name : 'الشركة'}</h2>
            <p>منتجات الشركة</p>
          </div>
        </div>
      </section>
      <section class="product-grid">${products.map((product) => productCard(product, tier, { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join('') || '<div class="empty-state">لا توجد منتجات</div>'}</section>
    </div>
  `;
}
