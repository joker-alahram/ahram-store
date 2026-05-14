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
  let rafId = null;

  function flush() {
    scheduled = false;
    rafId = null;
    const keys = Array.from(dirty);
    dirty.clear();
    for (const key of keys) {
      const fn = renderers[key];
      if (typeof fn === 'function') fn();
    }
    if (dirty.size) schedule();
  }

  function schedule(...keys) {
    for (const key of keys.flat()) {
      if (key !== undefined && key !== null) dirty.add(key);
    }
    if (!dirty.size || scheduled) return;
    scheduled = true;
    const runner = () => {
      if (!scheduled) return;
      flush();
    };
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(runner);
      return;
    }
    rafId = setTimeout(runner, 0);
  }

  return { schedule, flush };
}
