import { storageKeys, saveJSON, removeValue, loadJSON } from '../core/storage.js';

function normalizeIdentifier(identifier) {
  return String(identifier ?? '').trim();
}

export function normalizeUserRole(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'customer';
  if (['rep', 'sales_rep', 'sales rep', 'salesrep', 'representative', 'manager'].includes(raw)) return 'rep';
  return 'customer';
}

function inferRoleFromRow(row) {
  if (!row || typeof row !== 'object') return null;
  const explicit = row.userType || row.user_type || row.role || row.account_type || row.customer_type;
  if (explicit) {
    const normalized = normalizeUserRole(explicit);
    if (normalized) return normalized;
  }
  if (row.sales_rep_id || row.rep_id || row.created_by_rep_id) return 'rep';
  return null;
}

function canonicalSession(row, fallback = null) {
  if (!row) return null;
  const fallbackRole = fallback ? inferRoleFromRow(fallback) : null;
  const authoritativeRole = inferRoleFromRow(row);
  const userType = authoritativeRole || fallbackRole || 'customer';
  const session = {
    ...(fallback || {}),
    ...row,
    userType,
    role: userType,
  };

  if (!session.id && session.user_id) session.id = session.user_id;
  if (!session.name && session.full_name) session.name = session.full_name;
  if (!session.phone && session.mobile) session.phone = session.mobile;
  if (!session.username && session.login_code) session.username = session.login_code;
  return session;
}

async function fetchUserProfile(api, table, identifier) {
  const trimmed = normalizeIdentifier(identifier);
  if (!trimmed) return null;
  const select = 'id,name,phone,username,address,location,region,default_tier_name,is_active,is_blocked,blocked_reason,sales_rep_id,user_type';
  const primary = await api.get(table, {
    select,
    or: `(phone.eq.${trimmed},username.eq.${trimmed})`,
    limit: '1',
  }).catch(async () => {
    const byPhone = await api.get(table, { select, phone: `eq.${trimmed}`, limit: '1' }).catch(() => []);
    if (byPhone?.length) return byPhone;
    return await api.get(table, { select, username: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  });
  return primary?.[0] || null;
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
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const rows = await api.post(endpoint, {
        identifier,
        user_password: password,
      });
      if (Array.isArray(rows) && rows.length) return rows[0];
      if (rows && typeof rows === 'object') return rows;
    } catch (error) {
      lastError = error;
    }
  }
  const err = new Error('AUTH_BACKEND_REQUIRED');
  err.cause = lastError;
  throw err;
}

function mergeSession(authoritative, fallback = null) {
  if (!authoritative && !fallback) return null;
  return canonicalSession({ ...(fallback || {}), ...(authoritative || {}) }, fallback || authoritative || null);
}

export async function loadPersistedSession(api) {
  const persisted = loadJSON(storageKeys.session, null);
  if (!persisted?.id) return null;
  try {
    const authoritative = await fetchSessionById(api, persisted.id);
    if (authoritative) {
      if (authoritative.is_active === false || authoritative.is_blocked === true) {
        removeValue(storageKeys.session);
        return null;
      }
      const session = mergeSession(authoritative, persisted);
      saveJSON(storageKeys.session, session);
      return session;
    }
    const session = canonicalSession(persisted, persisted);
    saveJSON(storageKeys.session, session);
    return session;
  } catch {
    const session = canonicalSession(persisted, persisted);
    saveJSON(storageKeys.session, session);
    return session;
  }
}

function resolveRoleFromProfiles(authenticated, repProfile, customerProfile, authoritativeProfile) {
  const explicit = inferRoleFromRow(authenticated) || inferRoleFromRow(authoritativeProfile);
  if (explicit) return explicit;
  if (repProfile && !customerProfile) return 'rep';
  if (repProfile && customerProfile) {
    const repScore = Number(Boolean(repProfile.sales_rep_id || repProfile.rep_id || repProfile.created_by_rep_id));
    const customerScore = Number(Boolean(customerProfile.customer_type || customerProfile.user_type));
    return repScore >= customerScore ? 'rep' : 'customer';
  }
  if (customerProfile) return 'customer';
  return 'customer';
}

export async function login(api, identifier, password) {
  const trimmedIdentifier = normalizeIdentifier(identifier);
  const trimmedPassword = String(password || '').trim();
  if (!trimmedIdentifier || !trimmedPassword) throw new Error('INVALID_CREDENTIALS');

  const authenticated = await authenticateWithServer(api, trimmedIdentifier, trimmedPassword);
  const authId = authenticated?.id ?? authenticated?.user_id ?? null;
  const [authoritativeProfile, repProfile, customerProfile] = await Promise.all([
    authId ? fetchSessionById(api, authId).catch(() => null) : Promise.resolve(null),
    fetchUserProfile(api, 'sales_reps', trimmedIdentifier).catch(() => null),
    fetchUserProfile(api, 'customers', trimmedIdentifier).catch(() => null),
  ]);

  const userType = resolveRoleFromProfiles(authenticated, repProfile, customerProfile, authoritativeProfile);
  const preferredProfile = userType === 'rep'
    ? (repProfile || authoritativeProfile || customerProfile)
    : (customerProfile || authoritativeProfile || repProfile);

  const session = mergeSession(
    {
      ...(authenticated || {}),
      ...(preferredProfile || {}),
      userType,
      role: userType,
      id: authId || preferredProfile?.id || authenticated?.id,
      name: preferredProfile?.name || authenticated?.name || authenticated?.username || trimmedIdentifier,
      phone: preferredProfile?.phone || authenticated?.phone || null,
      username: preferredProfile?.username || authenticated?.username || trimmedIdentifier,
    },
    preferredProfile || authenticated,
  );

  saveJSON(storageKeys.session, session);
  return session;
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
