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

  function setState(nextState, meta = {}) {
    state = typeof nextState === 'function' ? nextState(clone(state)) : clone(nextState);
    if (meta && meta.silent) return state;
    for (const subscriber of Array.from(subscribers)) subscriber(state, meta);
    return state;
  }

  function patch(partial, meta = {}) {
    return setState((current) => merge(current, partial), meta);
  }

  function subscribe(handler) {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  function update(mutator, meta = {}) {
    return setState((current) => {
      const draft = clone(current);
      mutator(draft);
      return draft;
    }, meta);
  }

  return { getState, setState, patch, update, subscribe };
}
