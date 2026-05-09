import { storageKeys, saveJSON, removeValue } from '../core/storage.js';

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim();
}

async function fetchUserProfile(api, table, identifier) {
  const trimmed = normalizeIdentifier(identifier);
  const rows = await api.get(table, {
    select: 'id,name,phone,username,region,default_tier_name,is_active,is_blocked,blocked_reason',
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const phone = await api.get(table, { select: 'id,name,phone,username,region,default_tier_name,is_active,is_blocked,blocked_reason', phone: `eq.${trimmed}`, limit: '1' }).catch(() => []);
    if (phone?.length) return phone;
    return await api.get(table, { select: 'id,name,phone,username,region,default_tier_name,is_active,is_blocked,blocked_reason', username: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  });
  return rows?.[0] || null;
}

async function authenticateWithServer(api, identifier, password) {
  const endpoints = [
    'rpc/authenticate_user',
    'rpc/login_user',
    'rpc/auth_login',
  ];
  for (const endpoint of endpoints) {
    try {
      const rows = await api.post(endpoint, { identifier, password });
      if (Array.isArray(rows) && rows.length) return rows[0];
      if (rows && typeof rows === 'object') return rows;
    } catch {
      // try next endpoint
    }
  }
  throw new Error('AUTH_BACKEND_REQUIRED');
}

export async function login(api, identifier, password) {
  const trimmedIdentifier = normalizeIdentifier(identifier);
  const trimmedPassword = String(password || '').trim();
  if (!trimmedIdentifier || !trimmedPassword) throw new Error('INVALID_CREDENTIALS');

  const authenticated = await authenticateWithServer(api, trimmedIdentifier, trimmedPassword);
  const profileType = String(authenticated?.userType || authenticated?.user_type || '').trim();
  const session = {
    ...authenticated,
    userType: profileType || (authenticated?.sales_rep_id ? 'rep' : 'customer'),
  };

  const table = session.userType === 'rep' ? 'sales_reps' : 'customers';
  const profile = await fetchUserProfile(api, table, trimmedIdentifier).catch(() => null);
  const merged = { ...(profile || {}), ...session };
  saveJSON(storageKeys.session, merged);
  return merged;
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
