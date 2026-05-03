/* companies.runtime.js — company and customer surfaces */



function sortCompanies(rows = []) {
  return [...rows].sort((a, b) => compareNatural(a.company_id ?? a.id ?? '', b.company_id ?? b.id ?? ''));
}


function companyBackedProducts(companyId, limit = 8) {
  return [...state.products]
    .filter((product) => String(product.company_id) === String(companyId))
    .sort((a, b) => productScore(b) - productScore(a) || compareNatural(a.product_name, b.product_name))
    .slice(0, limit);
}


function bestCompanyCards(limit = 8) {
  if (state.topCompanies && state.topCompanies.length) {
    const ranked = [];
    for (const row of state.topCompanies) {
      const id = String(row.company_id || row.id || row.company || row.companyId || '').trim();
      if (!id) continue;
      const company = state.companies.find((item) => String(item.company_id) === id);
      if (!company) continue;
      ranked.push({ company, row });
    }

    if (ranked.length) {
      ranked.sort((a, b) => {
        const as = Number(a.row.total_sales || a.row.sales || a.row.total_qty || a.row.qty || a.row.count || 0);
        const bs = Number(b.row.total_sales || b.row.sales || b.row.total_qty || b.row.qty || b.row.count || 0);
        return bs - as || compareNatural(a.company.company_name, b.company.company_name);
      });
      return ranked.slice(0, limit).map((item) => item.company);
    }
  }

  const totals = new Map();
  for (const product of state.products || []) {
    const companyId = String(product.company_id || '');
    if (!companyId) continue;
    const score = productScore(product);
    totals.set(companyId, (totals.get(companyId) || 0) + score);
  }
  return [...state.companies]
    .sort((a, b) => (totals.get(String(b.company_id)) || 0) - (totals.get(String(a.company_id)) || 0) || compareNatural(a.company_name, b.company_name))
    .slice(0, limit);
}


function visibleHomeSettings() {
  const hidden = new Set(['banner_image', 'home_banner_image', 'banner', 'hero_banner', 'main_banner']);
  return state.settings.filter((row) => row.key && !hidden.has(row.key)).slice(0, 6);
}


function companyName(companyId) {
  return state.companyMap.get(companyId)?.company_name || companyId || '';
}


function renderCompanyPage() {

  const title = companyName(state.view.companyId);
  const products = filteredProducts();

  els.pageContent.innerHTML = `
    <div class="page-stack">
      <section class="grid product-grid">
        ${products.length ? products.map(productCardHtml).join('') : `<div class="empty-state">لا توجد منتجات تطابق البحث أو الشركة المحددة</div>`}
      </section>
    </div>
  `;
}
