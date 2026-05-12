import { companyCard, productCard } from '../components/cards.js';
import { normalize, getVisibleCompanies } from '../state/selectors.js';

function shelf(title, subtitle, itemsHtml, extraClass = '', gridClass = 'section-grid') {
  return `
    <section class="page-section page-section--dense ${extraClass}">
      <div class="page-section__head page-section__head--tight">
        <div>
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="${gridClass}">${itemsHtml}</div>
    </section>
  `;
}


function pickProducts(state, list) {
  const q = normalize(state.ui.search);
  return (list || []).filter((product) => {
    if (!product) return false;
    if (!q) return true;
    return normalize(product.product_name).includes(q)
      || normalize(product.company_name).includes(q)
      || normalize(product.product_id).includes(q)
      || normalize(product.company_id).includes(q);
  });
}

function productsByIds(state, ids) {
  const map = new Map((state.commerce.catalog.products || []).map((item) => [String(item.product_id), item]));
  return ids.map((id) => map.get(String(id))).filter(Boolean);
}

function topCompanyCards(state) {
  const topCompanies = (state.commerce.catalog.top?.companies || []).slice(0, 8);
  const companyLookup = new Map((state.commerce.catalog.companies || []).map((company) => [String(company.company_id), company]));
  const companies = topCompanies.map((row) => companyLookup.get(String(row.company_id)) || {
    company_id: row.company_id,
    company_name: row.company_name,
    company_logo: '',
  });
  return companies.length ? companies.map(companyCard).join('') : getVisibleCompanies(state).slice(0, 8).map(companyCard).join('');
}

export function renderHomePage(state) {
  const q = normalize(state.ui.search);
  const companies = getVisibleCompanies(state).filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });

  const products = pickProducts(state, state.commerce.catalog.products || []);
  const productLookup = new Map(products.map((product) => [String(product.product_id), product]));
  const topProducts = productsByIds(state, (state.commerce.catalog.top?.products || []).map((row) => row.product_id));
  const cartCompanyIds = new Set((state.commerce.cart || []).map((item) => String(item.companyId || item.company_id || '')));
  const basketProducts = products.filter((product) => cartCompanyIds.has(String(product.company_id || '')) || (state.commerce.cart || []).some((item) => String(item.id) === String(product.product_id))).slice(0, 8);
  const smartProducts = products.filter((product) => product.can_buy !== false).slice(0, 8);
  const mostRequested = products.filter((product) => Number(Object.values(product.units || {}).reduce((sum, unit) => sum + Number(unit.available_qty || 0), 0)) > 0).slice(0, 8);
  const featuredProducts = topProducts.length ? topProducts : products.filter((product) => product.can_buy !== false).slice(0, 8);

  return `
    <div class="page-stack page-stack--home">
      ${companies.length ? shelf('الشركات', 'تصفح الشركات المتاحة', companies.map(companyCard).join(''), 'page-section--companies', 'company-grid') : ''}
      ${featuredProducts.length ? shelf('الأكثر مبيعًا', 'أهم الأصناف المتاحة حاليًا', featuredProducts.map((product) => productCard(product, state.commerce.selectedTier ? state.commerce.catalog.tiers?.find((t) => t.tier_name === state.commerce.selectedTier) || state.commerce.catalog.tiers?.[0] : state.commerce.catalog.tiers?.[0], { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), 'page-section--products', 'product-grid') : ''}
      ${mostRequested.length ? shelf('الأكثر طلبًا', 'الأصناف الأكثر تداولًا', mostRequested.map((product) => productCard(product, state.commerce.catalog.tiers?.[0], { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), 'page-section--products', 'product-grid') : ''}
      ${basketProducts.length ? shelf('منتجات تناسب سلتك', 'اقتراحات مبنية على الطلب الحالي', basketProducts.map((product) => productCard(product, state.commerce.catalog.tiers?.[0], { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), 'page-section--products', 'product-grid') : ''}
      ${smartProducts.length ? shelf('الترشيحات الذكية', 'أصناف جاهزة للشراء السريع', smartProducts.map((product) => productCard(product, state.commerce.catalog.tiers?.[0], { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), 'page-section--products', 'product-grid') : ''}
    </div>
  `;
}
