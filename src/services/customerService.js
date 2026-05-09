import { storageKeys, saveJSON } from '../core/storage.js';
import { normalizeCustomerRow } from './contractUtils.js';

async function fetchRepCustomers(api, repId) {
  const queries = [
    { sales_rep_id: `eq.${repId}` },
    { rep_id: `eq.${repId}` },
    { created_by_rep_id: `eq.${repId}` },
  ];

  for (const filter of queries) {
    try {
      const rows = await api.get('v_rep_customers', { select: '*', ...filter, order: 'created_at.desc' });
      if (Array.isArray(rows) && rows.length) return rows.map(normalizeCustomerRow);
      if (Array.isArray(rows) && !rows.length) return rows.map(normalizeCustomerRow);
    } catch {
      continue;
    }
  }
  return [];
}

export async function loadRepCustomers(api, repId) {
  if (!repId) return [];
  return fetchRepCustomers(api, repId).catch(() => []);
}

export async function createCustomer(api, payload) {
  const rows = await api.post('customers', {
    name: String(payload.name || '').trim(),
    phone: String(payload.phone || '').trim() || null,
    address: String(payload.address || '').trim() || null,
    location: String(payload.location || '').trim() || null,
    username: String(payload.username || payload.phone || '').trim() || null,
    password: String(payload.password || '').trim() || null,
    customer_type: payload.customer_type || 'rep_customer',
    sales_rep_id: payload.sales_rep_id || null,
    created_by: payload.created_by || null,
    created_by_rep_id: payload.created_by_rep_id || payload.sales_rep_id || null,
    is_active: payload.is_active !== false,
    is_blocked: payload.is_blocked === true,
    default_tier_name: payload.default_tier_name || 'base',
  });
  const created = Array.isArray(rows) ? rows[0] : rows;
  return normalizeCustomerRow(created || payload);
}

export function persistSelectedCustomer(customer) {
  if (customer) saveJSON(storageKeys.customer, customer);
  else localStorage.removeItem(storageKeys.customer);
}
