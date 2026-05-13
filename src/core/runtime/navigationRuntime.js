import { parseRoute } from '../router.js';
import { createRuntimeScopeKey } from './runtimeGuards.js';

export function createNavigationRuntime() {
  function snapshot(route = null) {
    const resolved = route || parseRoute(location.hash || '#home');
    return createRuntimeScopeKey(resolved?.name || 'home', resolved?.params || {});
  }

  function hasRouteChanged(previousRoute = null, currentRoute = null) {
    return snapshot(previousRoute) !== snapshot(currentRoute);
  }

  return { snapshot, hasRouteChanged };
}
