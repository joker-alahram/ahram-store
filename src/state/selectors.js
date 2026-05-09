import { ROLES } from '../contracts/runtime.js';
import { buildProductIndex } from '../services/catalogService.js';

export function selectRole(state) {
  return state.auth?.role || ROLES.GUEST;
}

export function selectCompanyOptions(state) {
  return [{ company_id: 'all', company_name: 'جميع الشركات', company_logo: null, color: '#999' }, ...(state.data.companies || [])];
}

export function selectVisibleTier(state) {
  return state.data.tiers.find((tier) => tier.tier_name === state.ui.selectedTier) || state.data.tiers.find((tier) => tier.is_default) || state.data.tiers[0] || null;
}

export function selectProducts(state) {
  const q = (state.ui.search || '').trim().toLowerCase();
  const tier = state.ui.selectedTier;
  const company = state.ui.selectedCompany;
  let products = (state.data.products || []).filter((row) => row.runtime_healthy !== false);

  if (tier && tier !== 'all') {
    products = products.filter((row) => row.tier_name === tier);
  }
  if (company && company !== 'all') {
    products = products.filter((row) => row.company_id === company);
  }
  if (q) {
    products = products.filter((row) => [row.product_name, row.company_name, row.product_id, row.category].some((field) => String(field || '').toLowerCase().includes(q)));
  }

  return products.slice().sort((a, b) => String(a.company_name).localeCompare(String(b.company_name), 'ar') || String(a.product_name).localeCompare(String(b.product_name), 'ar'));
}

export function selectCatalog(state) {
  const products = buildProductIndex(selectProducts(state));
  return {
    products,
    companies: selectCompanyOptions(state),
    tiers: state.data.tiers || [],
    counts: {
      products: products.length,
      companies: (state.data.companies || []).length,
      orders: (state.data.orders || []).length,
      customers: (state.data.customers || []).length
    }
  };
}

export function selectCartItems(state) {
  return state.cart.items || [];
}

export function selectCartSummary(state) {
  const items = selectCartItems(state);
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price_snapshot || item.unit_price || 0) * item.quantity, 0);
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, quantity, grand_total: subtotal, discount_total: 0 };
}

export function selectAuthorizedCustomers(state) {
  const role = selectRole(state);
  const user = state.auth.user;
  if (role === ROLES.ADMIN) return state.data.customers || [];
  if (role === ROLES.SALES_REP) return (state.data.customers || []).filter((c) => c.sales_rep_id === user?.id || c.created_by_rep_id === user?.id);
  if (role === ROLES.CUSTOMER) return (state.data.customers || []).filter((c) => c.id === user?.id || c.username === user?.username);
  return [];
}

export function can(role, action) {
  const matrix = {
    guest: ['browse', 'login'],
    customer: ['browse', 'checkout', 'orders', 'cart', 'whatsapp'],
    sales_rep: ['browse', 'checkout', 'orders', 'cart', 'whatsapp', 'customers', 'analytics', 'assign'],
    admin: ['browse', 'checkout', 'orders', 'cart', 'whatsapp', 'customers', 'analytics', 'assign', 'reps', 'settings', 'edit_price']
  };
  return (matrix[role] || []).includes(action);
}
