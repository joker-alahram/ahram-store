import { loadJSON, removeValue, saveJSON, storageKeys } from '../core/storage.js';

const SELECT_FIELDS = 'id,name,phone,username,password,region,default_tier_name,is_active,is_blocked,blocked_reason';

async function lookupUser(api, table, identifier) {
  const value = String(identifier || '').trim();
  if (!value) return null;
  const rows = await api.get(table, { select: SELECT_FIELDS, or: `(phone.eq.${value},username.eq.${value})`, limit: '1' }).catch(async () => {
    const byPhone = await api.get(table, { select: SELECT_FIELDS, phone: `eq.${value}`, limit: '1' }).catch(() => []);
    if (byPhone?.length) return byPhone;
    return await api.get(table, { select: SELECT_FIELDS, username: `eq.${value}`, limit: '1' }).catch(() => []);
  });
  return rows?.[0] || null;
}

export async function login(api, identifier, password) {
  const customer = await lookupUser(api, 'customers', identifier);
  if (customer) {
    if (String(customer.password || '').trim() !== String(password || '').trim()) throw new Error('INVALID_PASSWORD');
    const session = { ...customer, userType: 'customer' };
    saveJSON(storageKeys.session, session);
    return session;
  }

  const rep = await lookupUser(api, 'sales_reps', identifier);
  if (rep) {
    if (String(rep.password || '').trim() !== String(password || '').trim()) throw new Error('INVALID_PASSWORD');
    const session = { ...rep, userType: 'rep' };
    saveJSON(storageKeys.session, session);
    return session;
  }

  throw new Error('USER_NOT_FOUND');
}

export async function registerCustomer(api, payload) {
  const exists = await api.get('customers', { phone: `eq.${payload.phone}`, select: 'id', limit: '1' }).catch(() => []);
  if (Array.isArray(exists) && exists.length) throw new Error('DUPLICATE_PHONE');
  const rows = await api.post('customers', {
    name: payload.name,
    phone: payload.phone,
    password: payload.password,
    address: payload.address,
    location: payload.location || null,
    username: payload.username || null,
    customer_type: 'direct',
    sales_rep_id: null,
    created_by: null,
    created_by_rep_id: null,
  });
  const created = Array.isArray(rows) ? rows[0] : rows;
  const session = { ...created, userType: 'customer' };
  saveJSON(storageKeys.session, session);
  return session;
}

export async function loadRepCustomers(api, repId) {
  if (!repId) return [];
  const rows = await api.get('v_rep_customers', {
    select: 'id,name,phone,address,location,username,password,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    order: 'created_at.desc',
  }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

export function logout() {
  removeValue(storageKeys.session);
  removeValue(storageKeys.customer);
}

export function getSession() {
  return loadJSON(storageKeys.session, null);
}
