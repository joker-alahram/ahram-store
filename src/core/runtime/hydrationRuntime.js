import { createRuntimeScopeKey } from './runtimeGuards.js';

export function createHydrationRuntime() {
  let hydrationSessionVersion = 0;
  const companyHydrationTokens = new Map();

  function createHydrationSession() {
    hydrationSessionVersion += 1;
    return hydrationSessionVersion;
  }

  function isHydrationSessionActive(token) {
    return token === hydrationSessionVersion;
  }

  function captureHydrationScope(route = null) {
    return {
      session: hydrationSessionVersion,
      route: createRuntimeScopeKey(route?.name || 'home', route?.params || {}),
    };
  }

  function isHydrationScopeActive(scope, currentRoute = null) {
    if (!scope || !isHydrationSessionActive(scope.session)) return false;
    return scope.route === createRuntimeScopeKey(currentRoute?.name || 'home', currentRoute?.params || {});
  }

  function setCompanyToken(companyId, token) {
    const key = String(companyId ?? '').trim();
    if (!key) return null;
    companyHydrationTokens.set(key, token);
    return token;
  }

  function getCompanyToken(companyId) {
    const key = String(companyId ?? '').trim();
    return key ? companyHydrationTokens.get(key) || null : null;
  }

  function revokeCompanyToken(companyId) {
    const key = String(companyId ?? '').trim();
    if (!key) return;
    companyHydrationTokens.delete(key);
  }

  function dispose() {
    companyHydrationTokens.clear();
  }

  return {
    get hydrationSessionVersion() { return hydrationSessionVersion; },
    companyHydrationTokens,
    createHydrationSession,
    isHydrationSessionActive,
    captureHydrationScope,
    isHydrationScopeActive,
    setCompanyToken,
    getCompanyToken,
    revokeCompanyToken,
    dispose,
  };
}
