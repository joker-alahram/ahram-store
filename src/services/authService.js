import { ROLES } from '../contracts/runtime.js';
import { createId } from '../utils/uuid.js';

export function createAuthService(store, eventLog) {
  return {
    restoreSession() {
      return store.getState().auth.session;
    },
    async login(identity, password) {
      const state = store.getState();
      const candidate = (state.data.authUsers || []).find((user) => {
        const identifier = [user.username, user.phone, user.login_code, user.name, user.id].filter(Boolean);
        return identifier.includes(identity) && String(user.password || '') === String(password || '');
      });

      if (!candidate) {
        const error = new Error('AUTH_INVALID_CREDENTIALS');
        error.code = 'AUTH_INVALID_CREDENTIALS';
        throw error;
      }
      if (candidate.is_blocked) {
        const error = new Error('AUTH_BLOCKED_USER');
        error.code = 'AUTH_BLOCKED_USER';
        throw error;
      }

      const session = {
        session_id: createId(),
        access_token: createId(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        user_id: candidate.id,
        user_type: candidate.user_type
      };

      store.setState((current) => ({
        auth: {
          status: 'authenticated',
          user: candidate,
          role: candidate.user_type || ROLES.GUEST,
          session
        },
        ui: {
          ...current.ui,
          selectedTier: candidate.default_tier_name || current.ui.selectedTier,
          route: 'home'
        },
        cart: {
          ...current.cart,
          customer_id: candidate.user_type === ROLES.CUSTOMER ? candidate.id : current.cart.customer_id
        }
      }), { action: 'login' });

      eventLog('login', {
        actor_id: candidate.id,
        actor_type: candidate.user_type,
        session_id: session.session_id,
        payload: { identity }
      });

      return { session, user: candidate };
    },
    logout() {
      const currentUser = store.getState().auth.user;
      const session = store.getState().auth.session;
      store.setState((current) => ({
        auth: { status: 'anonymous', user: null, role: ROLES.GUEST, session: null }
      }), { action: 'logout' });

      if (currentUser) {
        eventLog('logout', {
          actor_id: currentUser.id,
          actor_type: currentUser.user_type,
          session_id: session?.session_id,
          payload: {}
        });
      }
    }
  };
}
