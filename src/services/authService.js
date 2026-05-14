import { storageKeys, saveJSON, removeValue, loadJSON } from '../core/storage.js';
import { resolveCanonicalRepId } from '../runtime/ownershipResolver.js';

function normalizeIdentifier(identifier) {
  return String(identifier || '').trim();
}

export function normalizeUserType(value, fallback = null) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'rep' || raw === 'sales_rep' || raw === 'sales rep' || raw === 'sales-rep') return 'rep';
  if (raw === 'admin') return 'admin';
  if (raw === 'customer' || raw === 'direct') return 'customer';
  return fallback;
}

export function normalizeSessionRecord(session) {
  if (!session || typeof session !== 'object') return null;
  const explicit = session.userType || session.user_type || session.role || null;
  const userType = normalizeUserType(
    explicit
    || (session.admin_id ? 'admin' : null)
    || (session.customer_id ? 'customer' : null)
    || (session.sales_rep_id || session.rep_id || session.created_by_rep_id ? 'rep' : null),
    null,
  );
  const canonicalSalesRepId = resolveCanonicalRepId({ ...session, userType });
  return {
    ...session,
    sales_rep_id: canonicalSalesRepId,
    rep_id: session.rep_id ?? canonicalSalesRepId,
    created_by_rep_id: session.created_by_rep_id ?? null,
    userType,
    user_type: userType,
  };
}

const PROFILE_SELECT = {
  admins: 'id,name,phone,username,is_active,is_blocked,blocked_reason',
  sales_reps: 'id,name,phone,username,region,default_tier_name,is_active,is_blocked,blocked_reason',
  customers: 'id,name,phone,username,region,default_tier_name,is_active,is_blocked,blocked_reason',
};

async function fetchUserProfile(api, table, identifier) {
  const trimmed = normalizeIdentifier(identifier);
  const select = PROFILE_SELECT[table] || PROFILE_SELECT.customers;
  const phoneRows = await api.get(table, { select, phone: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  if (Array.isArray(phoneRows) && phoneRows.length) return phoneRows[0] || null;
  const usernameRows = await api.get(table, { select, username: `eq.${trimmed}`, limit: '1' }).catch(() => []);
  return usernameRows?.[0] || null;
}

async function fetchIdentityProfiles(api, identifier) {
  const tables = ['admins', 'sales_reps', 'customers'];
  const results = await Promise.allSettled(tables.map((table) => fetchUserProfile(api, table, identifier)));
  return tables.map((table, index) => ({
    table,
    row: results[index].status === 'fulfilled' ? results[index].value : null,
  })).filter((entry) => entry.row);
}

function resolveAuthoritativeUserType(authenticated) {
  const authType = normalizeUserType(authenticated?.userType || authenticated?.user_type || authenticated?.role || null, null);
  return authType || null;
}

const USER_TYPE_TO_TABLE = {
  admin: 'admins',
  rep: 'sales_reps',
  customer: 'customers',
};

async function authenticateWithServer(api, identifier, password) {
  const endpoints = [
    'rpc/authenticate_user',
    'rpc/login_user',
    'rpc/auth_login',
  ];
  for (const endpoint of endpoints) {
    try {
      const rows = await api.post(endpoint, { identifier, user_password: password });
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

  const authenticated = normalizeSessionRecord(await authenticateWithServer(api, trimmedIdentifier, trimmedPassword));
  const profiles = await fetchIdentityProfiles(api, trimmedIdentifier);
  const profileMap = Object.fromEntries(profiles.map((entry) => [entry.table, entry.row]));
  const authoritativeType = resolveAuthoritativeUserType(authenticated);
  if (!authoritativeType) {
    throw new Error('AUTH_ROLE_UNRESOLVED');
  }

  const authoritativeTable = USER_TYPE_TO_TABLE[authoritativeType];
  const authoritativeProfile = authoritativeTable ? profileMap[authoritativeTable] || null : null;
  if (!authoritativeProfile) {
    throw new Error('AUTH_PROFILE_MISSING');
  }

  const session = normalizeSessionRecord({
    ...authoritativeProfile,
    ...authenticated,
    userType: authoritativeType,
    user_type: authoritativeType,
  });

  if (normalizeUserType(session?.userType, null) !== authoritativeType) {
    throw new Error('AUTH_ROLE_UNRESOLVED');
  }

  saveJSON(storageKeys.session, session);
  return session;
}

export function logout() {
  removeValue(storageKeys.session);
  removeValue(storageKeys.selectedCustomer);
}

export function currentSession() {
  return normalizeSessionRecord(loadJSON(storageKeys.session, null));
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
  const session = normalizeSessionRecord({ ...created, userType: 'customer', user_type: 'customer' });
  saveJSON(storageKeys.session, session);
  return session;
}
