import { storageKeys, saveJSON, removeValue } from '../core/storage.js';

async function lookupUser(api, table, identifier) {
  const trimmed = String(identifier || '').trim();
  const rows = await api.get(table, {
    select: 'id,name,phone,username,password,region,default_tier_name,is_active,is_blocked,blocked_reason',
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const phone = await api.get(table, { select: 'id,name,phone,username,password,region,default_tier_name,is_active,is_blocked,blocked_reason', phone: `eq.${trimmed}`, limit: '1' }).catch(() => []);
    if (phone?.length) return phone;
    return await api.get(table, { select: 'id,name,phone,username,password,region,default_tier_name,is_active,is_blocked,blocked_reason', username: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  });
  return rows?.[0] || null;
}

export async function login(api, identifier, password) {
  const customer = await lookupUser(api, 'customers', identifier);
  if (customer) {
    if (String(customer.password || '').trim() !== String(password || '').trim()) {
      throw new Error('INVALID_PASSWORD');
    }
    const session = { ...customer, userType: 'customer' };
    saveJSON(storageKeys.session, session);
    return session;
  }

  const rep = await lookupUser(api, 'sales_reps', identifier);
  if (rep) {
    if (String(rep.password || '').trim() !== String(password || '').trim()) {
      throw new Error('INVALID_PASSWORD');
    }
    const session = { ...rep, userType: 'rep' };
    saveJSON(storageKeys.session, session);
    return session;
  }

  throw new Error('USER_NOT_FOUND');
}

export function logout() {
  removeValue(storageKeys.session);
  removeValue(storageKeys.customer);
}

export function currentSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.session) || 'null');
  } catch {
    return null;
  }
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
