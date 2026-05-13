function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function merge(target, patch) {
  if (!isObject(target) || !isObject(patch)) return patch;
  const next = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      next[key] = [...value];
    } else if (isObject(value) && isObject(target[key])) {
      next[key] = merge(target[key], value);
    } else {
      next[key] = value;
    }
  }
  return next;
}

export function createStore(initialState) {
  let state = clone(initialState);
  const subscribers = new Set();

  function getState() {
    return state;
  }

  function commit(nextState, meta = {}) {
    state = nextState;
    if (meta && meta.silent) return state;
    for (const subscriber of Array.from(subscribers)) subscriber(state, meta);
    return state;
  }

  function setState(nextState, meta = {}) {
    const resolved = typeof nextState === 'function' ? nextState(clone(state)) : clone(nextState);
    return commit(resolved, meta);
  }

  function patch(partial, meta = {}) {
    return commit(merge(state, partial), meta);
  }

  function subscribe(handler) {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  function update(mutator, meta = {}) {
    const draft = clone(state);
    const result = mutator(draft);
    if (result === false) return state;
    return commit(draft, meta);
  }

  return { getState, setState, patch, update, subscribe };
}
