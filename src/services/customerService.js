import { storageKeys, saveJSON } from '../core/storage.js';

export async function loadRepCustomers(api, repId) {
  if (!repId) return [];
  const rows = await api.get('v_rep_customers', {
    select: 'id,name,phone,address,location,username,password,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    order: 'created_at.desc',
  }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export async function createCustomer(api, payload) {
  const rows = await api.post('customers', payload).catch((error) => { throw error; });
  return Array.isArray(rows) ? rows[0] : rows;
}

export function persistSelectedCustomer(customer) {
  if (customer) saveJSON(storageKeys.customer, customer);
  else localStorage.removeItem(storageKeys.customer);
}
