import { storageKeys, saveJSON, removeValue } from '../core/storage.js';

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9+]/g, '').trim();
}

function normalizeIdentifier(value) {
  return String(value || '').trim();
}

async function lookupAuthUser(api, identifier) {
  const raw = normalizeIdentifier(identifier);
  const phone = normalizePhone(identifier);
  const queries = [];
  if (phone) queries.push(`phone.eq.${phone}`);
  if (raw && raw !== phone) queries.push(`phone.eq.${raw}`);
  if (raw) {
    queries.push(`username.eq.${raw}`);
    queries.push(`rep_code.eq.${raw}`);
  }

  const rows = await api.get('v_auth_users', {
    select: 'id,user_type,name,phone,username,password,rep_code,default_tier_name,is_active,is_blocked',
    or: `(${queries.join(',')})`,
    limit: '20',
  }).catch(async () => {
    const byPhone = phone ? await api.get('v_auth_users', { select: 'id,user_type,name,phone,username,password,rep_code,default_tier_name,is_active,is_blocked', phone: `eq.${phone}`, limit: '20' }).catch(() => []) : [];
    const byUsername = raw ? await api.get('v_auth_users', { select: 'id,user_type,name,phone,username,password,rep_code,default_tier_name,is_active,is_blocked', username: `eq.${raw}`, limit: '20' }).catch(() => []) : [];
    const byRepCode = raw ? await api.get('v_auth_users', { select: 'id,user_type,name,phone,username,password,rep_code,default_tier_name,is_active,is_blocked', rep_code: `eq.${raw}`, limit: '20' }).catch(() => []) : [];
    return [...byPhone, ...byUsername, ...byRepCode];
  });

  const list = Array.isArray(rows) ? rows : [];
  return list.find((row) => normalizePhone(row.phone) === phone && phone) || list.find((row) => normalizeIdentifier(row.username) === raw) || list.find((row) => normalizeIdentifier(row.rep_code) === raw) || list[0] || null;
}

export async function login(api, identifier, password) {
  const user = await lookupAuthUser(api, identifier);
  if (!user) throw new Error('USER_NOT_FOUND');
  if (String(user.is_blocked) === 'true' || user.is_blocked === true) throw new Error('USER_BLOCKED');
  if (String(user.is_active) === 'false' || user.is_active === false) throw new Error('USER_INACTIVE');
  if (String(user.password || '').trim() !== String(password || '').trim()) throw new Error('INVALID_PASSWORD');

  const session = {
    ...user,
    phone: normalizePhone(user.phone) || String(user.phone || '').trim(),
    userType: String(user.user_type || 'customer').trim(),
  };
  saveJSON(storageKeys.session, session);
  return session;
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
  const exists = await api.get('customers', { phone: `eq.${normalizePhone(payload.phone) || normalizeIdentifier(payload.phone)}`, select: 'id', limit: '1' }).catch(() => []);
  if (Array.isArray(exists) && exists.length) throw new Error('DUPLICATE_PHONE');
  const rows = await api.post('customers', {
    name: payload.name,
    phone: normalizePhone(payload.phone) || normalizeIdentifier(payload.phone),
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
