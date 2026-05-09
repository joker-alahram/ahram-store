import { storageKeys, saveJSON, removeValue, loadJSON } from '../core/storage.js';
import { generateSessionToken, normalizeAuthUserRow, normalizeRole, sessionExpiry } from './contractUtils.js';

function authSelect() {
  return 'id,user_type,name,phone,username,login_code,password,default_tier_name,is_active,is_blocked,blocked_reason';
}

async function lookupUser(api, identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;

  const queries = [
    { or: `(phone.eq.${trimmed},username.eq.${trimmed},login_code.eq.${trimmed})`, limit: '1' },
    { phone: `eq.${trimmed}`, limit: '1' },
    { username: `eq.${trimmed}`, limit: '1' },
    { login_code: `eq.${trimmed}`, limit: '1' },
  ];

  for (const params of queries) {
    try {
      const rows = await api.get('v_auth_users', { select: authSelect(), ...params });
      if (Array.isArray(rows) && rows.length) return normalizeAuthUserRow(rows[0]);
    } catch {
      continue;
    }
  }

  return null;
}

function buildSession(user) {
  if (!user) return null;
  const role = normalizeRole(user.user_type);
  return {
    session_id: generateSessionToken(),
    access_token: generateSessionToken(),
    expires_at: sessionExpiry(30),
    id: user.id,
    user_id: user.id,
    user_type: role,
    userType: role === 'sales_rep' ? 'rep' : role,
    role,
    name: user.name,
    phone: user.phone,
    username: user.username,
    login_code: user.login_code,
    default_tier_name: user.default_tier_name || 'base',
    is_active: user.is_active,
    is_blocked: user.is_blocked,
    blocked_reason: user.blocked_reason || '',
  };
}

function touchSession(session) {
  if (!session) return null;
  return { ...session, expires_at: sessionExpiry(30) };
}

export async function login(api, identifier, password) {
  const user = await lookupUser(api, identifier);
  if (!user) throw new Error('AUTH_INVALID_CREDENTIALS');
  if (!user.is_active) throw new Error('AUTH_BLOCKED_USER');
  if (user.is_blocked) throw new Error('AUTH_BLOCKED_USER');
  if (String(user.password || '').trim() !== String(password || '').trim()) {
    throw new Error('AUTH_INVALID_CREDENTIALS');
  }

  const session = buildSession(user);
  saveJSON(storageKeys.session, session);
  return session;
}

export function currentSession() {
  const session = loadJSON(storageKeys.session, null);
  if (!session) return null;
  const expiry = Date.parse(session.expires_at || 0);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    removeValue(storageKeys.session);
    return null;
  }
  return touchSession(session);
}

export async function restoreSession(api) {
  const session = currentSession();
  if (!session) return null;

  try {
    const rows = await api.get('v_auth_users', { select: authSelect(), id: `eq.${session.id}`, limit: '1' });
    const fresh = Array.isArray(rows) && rows.length ? normalizeAuthUserRow(rows[0]) : null;
    if (!fresh || !fresh.is_active || fresh.is_blocked) {
      removeValue(storageKeys.session);
      return null;
    }
    const next = { ...buildSession(fresh), access_token: session.access_token || generateSessionToken(), session_id: session.session_id || generateSessionToken() };
    saveJSON(storageKeys.session, next);
    return next;
  } catch {
    const next = touchSession(session);
    saveJSON(storageKeys.session, next);
    return next;
  }
}

export function logout() {
  removeValue(storageKeys.session);
  removeValue(storageKeys.customer);
}

export async function registerCustomer(api, payload) {
  const phone = String(payload.phone || '').trim();
  const exists = await api.get('customers', { select: 'id', phone: `eq.${phone}`, limit: '1' }).catch(() => []);
  if (Array.isArray(exists) && exists.length) throw new Error('DUPLICATE_PHONE');

  const rows = await api.post('customers', {
    name: String(payload.name || '').trim(),
    phone,
    password: String(payload.password || '').trim(),
    address: String(payload.address || '').trim() || null,
    location: String(payload.location || '').trim() || null,
    username: String(payload.username || phone).trim(),
    customer_type: 'direct',
    sales_rep_id: null,
    is_active: true,
    is_blocked: false,
    default_tier_name: String(payload.default_tier_name || 'base').trim(),
  });

  const created = Array.isArray(rows) ? rows[0] : rows;
  const session = {
    ...buildSession(normalizeAuthUserRow({
      id: created?.id || generateSessionToken(),
      user_type: 'customer',
      name: created?.name || payload.name,
      phone: created?.phone || phone,
      username: created?.username || payload.username || phone,
      login_code: created?.login_code || payload.username || phone,
      password: created?.password || payload.password,
      default_tier_name: created?.default_tier_name || payload.default_tier_name || 'base',
      is_active: true,
      is_blocked: false,
    })),
    user_type: 'customer',
    userType: 'customer',
  };

  saveJSON(storageKeys.session, session);
  return session;
}

export async function changePassword(api, session, currentPassword, nextPassword) {
  if (!session?.id) throw new Error('NO_SESSION');
  const rows = await api.get('v_auth_users', { select: authSelect(), id: `eq.${session.id}`, limit: '1' }).catch(() => []);
  const user = Array.isArray(rows) && rows.length ? normalizeAuthUserRow(rows[0]) : null;
  if (!user) throw new Error('AUTH_INVALID_CREDENTIALS');
  if (String(user.password || '').trim() !== String(currentPassword || '').trim()) throw new Error('AUTH_INVALID_CREDENTIALS');
  await api.patch(user.user_type === 'admin' ? 'admins' : user.user_type === 'sales_rep' ? 'sales_reps' : 'customers', { password: String(nextPassword || '').trim() }, { id: `eq.${user.id}` });
  return true;
}
