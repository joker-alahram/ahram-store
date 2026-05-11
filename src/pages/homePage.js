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

function placeholder(label) {
  return `<div class="empty-state empty-state--recovery"><p>${label}</p><button class="btn btn--primary" type="button" data-action="refresh-catalog">تحديث المنتجات والأسعار</button></div>`;
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

function selectedTier(state, product) {
  return state.commerce.selectedTier
    ? state.commerce.catalog.tiers?.find((tier) => tier.tier_name === state.commerce.selectedTier) || state.commerce.catalog.tiers?.[0]
    : state.commerce.catalog.tiers?.[0];
}

function renderProductSection(state, title, subtitle, products, loading, gridClass = 'product-grid') {
  if (products.length) {
    return shelf(title, subtitle, products.map((product) => productCard(product, selectedTier(state, product), { unit: state.commerce.unitPrefs[product.product_id], qty: state.commerce.qtyPrefs[product.product_id] || 1, inCart: state.commerce.cart.some((item) => item.type === 'product' && item.id === product.product_id) })).join(''), 'page-section--products', gridClass);
  }
  return shelf(title, subtitle, placeholder(loading ? 'جارٍ استعادة البيانات…' : 'لا توجد منتجات متاحة'), 'page-section--products', gridClass);
}

export function renderHomePage(state) {
  const q = normalize(state.ui.search);
  const loading = Boolean(state.runtime.loading.catalog || state.runtime.loading.company || !state.app.ready);
  const companies = getVisibleCompanies(state).filter((company) => {
    if (!q) return true;
    return normalize(company.company_name).includes(q) || normalize(company.company_id).includes(q);
  });

  const products = pickProducts(state, state.commerce.catalog.products || []);
  const topProducts = productsByIds(state, (state.commerce.catalog.top?.products || []).map((row) => row.product_id));
  const cartCompanyIds = new Set((state.commerce.cart || []).map((item) => String(item.companyId || item.company_id || '')));
  const basketProducts = products.filter((product) => cartCompanyIds.has(String(product.company_id || '')) || (state.commerce.cart || []).some((item) => String(item.id) === String(product.product_id))).slice(0, 8);
  const smartProducts = products.filter((product) => product.can_buy !== false).slice(0, 8);
  const mostRequested = products.filter((product) => Number(Object.values(product.units || {}).reduce((sum, unit) => sum + Number(unit.available_qty || 0), 0)) > 0).slice(0, 8);
  const featuredProducts = topProducts.length ? topProducts : products.filter((product) => product.can_buy !== false).slice(0, 8);

  return `
    <div class="page-stack page-stack--home">
      ${shelf('الشركات', 'تصفح الشركات المتاحة', companies.length ? companies.map(companyCard).join('') : placeholder(loading ? 'جارٍ استعادة الشركات…' : 'لا توجد شركات'), 'page-section--companies', 'company-grid')}
      ${renderProductSection(state, 'الأكثر مبيعًا', 'أهم الأصناف المتاحة حاليًا', featuredProducts, loading)}
      ${renderProductSection(state, 'الأكثر طلبًا', 'الأصناف الأكثر تداولًا', mostRequested, loading)}
      ${renderProductSection(state, 'منتجات تناسب سلتك', 'اقتراحات مبنية على الطلب الحالي', basketProducts, loading)}
      ${renderProductSection(state, 'الترشيحات الذكية', 'أصناف جاهزة للإضافة بسرعة', smartProducts, loading)}
    </div>
  `;
}
