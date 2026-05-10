import { storageKeys, saveJSON, removeValue, loadJSON } from '../core/storage.js';

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim();
}

function normalizeUserType(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'rep' || raw === 'sales_rep' ? 'rep' : 'customer';
}

function canonicalSession(row, fallback = null) {
  if (!row) return null;
  const inferred = row.userType || row.user_type || fallback?.userType || fallback?.user_type || (row.sales_rep_id ? 'rep' : 'customer');
  const userType = normalizeUserType(inferred);
  return {
    ...(fallback || {}),
    ...row,
    userType,
  };
}

async function fetchUserProfile(api, table, identifier) {
  const trimmed = normalizeIdentifier(identifier);
  const select = 'id,name,phone,username,address,location,region,default_tier_name,is_active,is_blocked,blocked_reason,sales_rep_id,user_type';
  const rows = await api.get(table, {
    select,
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const phone = await api.get(table, { select, phone: `eq.${trimmed}`, limit: '1' }).catch(() => []);
    if (phone?.length) return phone;
    return await api.get(table, { select, username: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  });
  return rows?.[0] || null;
}

async function fetchSessionById(api, id) {
  const rows = await api.get('v_auth_users', {
    select: 'id,name,phone,username,address,location,region,default_tier_name,is_active,is_blocked,blocked_reason,sales_rep_id,user_type',
    id: `eq.${id}`,
    limit: '1',
  }).catch(() => []);
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
      const rows = await api.post(endpoint, {
        identifier,
        user_password: password,
      });
      if (Array.isArray(rows) && rows.length) return rows[0];
      if (rows && typeof rows === 'object') return rows;
    } catch {
      // try next endpoint
    }
  }
  throw new Error('AUTH_BACKEND_REQUIRED');
}

export async function loadPersistedSession(api) {
  const persisted = loadJSON(storageKeys.session, null);
  if (!persisted?.id) return null;
  try {
    const authoritative = await fetchSessionById(api, persisted.id);
    if (!authoritative || authoritative.is_active === false || authoritative.is_blocked === true) {
      removeValue(storageKeys.session);
      return null;
    }
    const session = canonicalSession(authoritative, persisted);
    saveJSON(storageKeys.session, session);
    return session;
  } catch {
    removeValue(storageKeys.session);
    return null;
  }
}

export async function login(api, identifier, password) {
  const trimmedIdentifier = normalizeIdentifier(identifier);
  const trimmedPassword = String(password || '').trim();
  if (!trimmedIdentifier || !trimmedPassword) throw new Error('INVALID_CREDENTIALS');

  const authenticated = await authenticateWithServer(api, trimmedIdentifier, trimmedPassword);
  const session = canonicalSession(authenticated, authenticated);
  const profileType = normalizeUserType(session.userType || session.user_type || (session.sales_rep_id ? 'rep' : 'customer'));
  session.userType = profileType;

  const profile = await fetchUserProfile(api, profileType === 'rep' ? 'sales_reps' : 'customers', trimmedIdentifier).catch(() => null);
  const merged = canonicalSession({ ...(profile || {}), ...session }, session);
  saveJSON(storageKeys.session, merged);
  return merged;
}

export function logout() {
  removeValue(storageKeys.session);
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
  const session = canonicalSession(created, { userType: 'customer' });
  saveJSON(storageKeys.session, session);
  return session;
}
