import { repo } from '../api/repositories.js';
import { DEMO } from '../contracts.js';
import { resetSession, setSession } from '../state/store.js';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export async function login(identifier, password) {
  try {
    const result = await repo.login({ login: identifier, password });
    setSession(result.session ? { ...result.session, user: result.user } : result);
    return result;
  } catch {
    const user = DEMO.users.find(u => !u.is_blocked && u.is_active && (normalize(u.username) === normalize(identifier) || normalize(u.phone) === normalize(identifier) || normalize(u.login_code) === normalize(identifier)) && String(u.password ?? '') === String(password ?? ''));
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'AUTH_INVALID_CREDENTIALS' });
    }
    const session = {
      session_id: crypto.randomUUID(),
      access_token: crypto.randomUUID().replace(/-/g, ''),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user,
    };
    setSession(session);
    return { session, user };
  }
}

export async function logout() {
  try { await repo.logout(); } catch {}
  resetSession();
}

export async function restoreSession() {
  try {
    const result = await repo.session();
    if (result?.user) setSession(result);
    return result;
  } catch {
    return null;
  }
}
