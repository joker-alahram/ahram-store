import { api } from './client.js';
import { DEMO } from '../contracts.js';

const TABLE = {
  settings: '/v_app_settings?select=*',
  users: '/v_auth_users?select=*',
  tiers: '/v_visible_tiers?select=*',
  products: '/v_runtime_products?select=*',
  health: '/v_runtime_commerce_health?select=*',
  productsWithCategory: '/products_with_category?select=*',
  repCustomers: '/v_rep_customers?select=*',
  orders: '/v_orders_status?select=*',
  repSales: '/v_rep_sales?select=*',
  customers: '/customers?select=*',
  salesReps: '/sales_reps?select=*',
  dailyDeals: '/daily_deals?select=*',
  flashOffers: '/flash_offers?select=*',
};

function demoDelay(value) {
  return Promise.resolve(structuredClone(value));
}

async function safeGet(path, fallback) {
  try {
    return await api.request(path, { method: 'GET' });
  } catch {
    return demoDelay(fallback);
  }
}

export const repo = {
  async settings() { return safeGet(TABLE.settings, DEMO.settings); },
  async users() { return safeGet(TABLE.users, DEMO.users); },
  async tiers() { return safeGet(TABLE.tiers, DEMO.tiers); },
  async products() { return safeGet(TABLE.products, DEMO.products); },
  async health() { return safeGet(TABLE.health, [{ status: 'healthy', runtime_healthy: true }]); },
  async productsWithCategory() { return safeGet(TABLE.productsWithCategory, DEMO.products); },
  async repCustomers(repId = '') { return safeGet(`${TABLE.repCustomers}${repId ? `&sales_rep_id=eq.${encodeURIComponent(repId)}` : ''}`, DEMO.customers); },
  async orders(userId = '') { return safeGet(`${TABLE.orders}${userId ? `&user_id=eq.${encodeURIComponent(userId)}` : ''}`, DEMO.orders); },
  async repSales(repId = '') { return safeGet(`${TABLE.repSales}${repId ? `&sales_rep_id=eq.${encodeURIComponent(repId)}` : ''}`, []); },
  async customers() { return safeGet(TABLE.customers, DEMO.customers); },
  async salesReps() { return safeGet(TABLE.salesReps, DEMO.users.filter(u => u.user_type === 'sales_rep')); },
  async dailyDeals() { return safeGet(TABLE.dailyDeals, []); },
  async flashOffers() { return safeGet(TABLE.flashOffers, []); },
  async login(payload) { return api.request('/auth/login', { method: 'POST', body: payload, auth: false }); },
  async logout() { return api.request('/auth/logout', { method: 'POST', auth: true }); },
  async session() { return api.request('/auth/session', { method: 'GET', auth: true }); },
  async changePassword(payload) { return api.request('/auth/change-password', { method: 'POST', body: payload, auth: true }); },
  async createOrder(payload, idemKey) { return api.request('/orders', { method: 'POST', body: payload, headers: idemKey ? { 'Idempotency-Key': idemKey } : {}, auth: true }); },
  async updateOrderStatus(orderId, payload) { return api.request(`/orders/${orderId}/status`, { method: 'PATCH', body: payload, auth: true }); },
  async updateOrderItems(orderId, payload) { return api.request(`/orders/${orderId}/items`, { method: 'PATCH', body: payload, auth: true }); },
  async whatsappInvoice(orderId) { return api.request(`/orders/${orderId}/whatsapp`, { method: 'POST', auth: true }); },
  async createCustomer(payload, idemKey) { return api.request('/customers', { method: 'POST', body: payload, headers: idemKey ? { 'Idempotency-Key': idemKey } : {}, auth: true }); },
  async updateCustomer(customerId, payload) { return api.request(`/customers/${customerId}`, { method: 'PATCH', body: payload, auth: true }); },
  async blockCustomer(customerId, payload) { return api.request(`/customers/${customerId}/block`, { method: 'PATCH', body: payload, auth: true }); },
  async createSalesRep(payload) { return api.request('/sales-reps', { method: 'POST', body: payload, auth: true }); },
  async updateSalesRep(repId, payload) { return api.request(`/sales-reps/${repId}`, { method: 'PATCH', body: payload, auth: true }); },
  async reassignCustomers(repId, payload) { return api.request(`/sales-reps/${repId}/reassign-customers`, { method: 'POST', body: payload, auth: true }); },
};
