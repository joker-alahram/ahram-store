export function createRuntimeScopeKey(routeName = 'home', params = {}) {
  const normalizedParams = Object.entries(params && typeof params === 'object' ? params : {})
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([key, value]) => `${key}:${String(value ?? '')}`)
    .join('&');
  return `${String(routeName || 'home')}|${normalizedParams}`;
}

export function createRuntimeSessionRegistry() {
  const sessions = new Map();
  return {
    register(scope, token) { sessions.set(String(scope), token); },
    get(scope) { return sessions.get(String(scope)) || null; },
    revoke(scope) { sessions.delete(String(scope)); },
    clear() { sessions.clear(); },
  };
}

export function isActiveScope(scope, sessionToken, currentScopeKey) {
  return Boolean(scope)
    && Number(scope.session || 0) === Number(sessionToken || 0)
    && String(scope.route || '') === String(currentScopeKey || '');
}
