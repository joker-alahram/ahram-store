import { companyCard, productCard } from '../components/cards.js';
import { getVisibleCompanies, normalize } from '../state/selectors.js';

function shelf(title, itemsHtml, moreAction = '') {
  return `
    <section class="page-section">
      <div class="page-section__head">
        <div>
          <h2>${title}</h2>
        </div>
        ${moreAction}
      </div>
      <div class="section-grid">${itemsHtml}</div>
    </section>
  `;
}

function rankProducts(state) {
  return Object.values(state.commerce.catalog.productIndex || {}).slice().sort((a, b) => String(a.product_name).localeCompare(String(b.product_name), 'ar'));
}

export function renderHomePage(state) {
  const companies = getVisibleCompanies(state).slice(0, 8);
  const products = rankProducts(state).filter((product) => {
    const q = normalize(state.ui.search);
    if (!q) return true;
    return normalize(product.product_name).includes(q) || normalize(product.company_name).includes(q);
  }).slice(0, 8);

  return `
    <div class="page-stack">
      ${shelf('الشركات', companies.map(companyCard).join(''), '<button class="btn btn--ghost" data-action="go-companies" type="button">عرض الكل</button>')}
      ${shelf('منتجات مختارة', products.map((product) => productCard(product, state.commerce.priceBook.tierName ? state.commerce.catalog.tiers.find((t) => t.tier_name === state.commerce.priceBook.tierName) : null, { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), '<button class="btn btn--ghost" data-action="go-companies" type="button">تصفح المنتجات</button>')}
    </div>
  `;
}
