export function createEmitter() {
  const listeners = new Map();

  function on(event, handler) {
    const set = listeners.get(event) || new Set();
    set.add(handler);
    listeners.set(event, set);
    return () => off(event, handler);
  }

  function off(event, handler) {
    const set = listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (!set.size) listeners.delete(event);
  }

  function emit(event, payload) {
    const set = listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[emitter:${event}]`, error);
      }
    }
  }

  return { on, off, emit };
}

export function createRenderLoop(renderers = {}) {
  const dirty = new Set();
  let scheduled = false;

  function flush() {
    scheduled = false;
    const keys = Array.from(dirty);
    dirty.clear();
    for (const key of keys) {
      const fn = renderers[key];
      if (typeof fn === 'function') fn();
    }
  }

  function schedule(...keys) {
    for (const key of keys.flat()) dirty.add(key);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }

  return { schedule, flush };
}
