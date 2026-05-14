export function createRenderRuntime(renderers = {}, options = {}) {
  const dirty = new Set();
  let scheduled = false;
  let rafId = null;
  const maxBatchSize = Number(options.maxBatchSize || 32);

  function flush() {
    scheduled = false;
    rafId = null;
    const keys = Array.from(dirty).slice(0, maxBatchSize);
    for (const key of keys) dirty.delete(key);
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
    const runner = () => { if (scheduled) flush(); };
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(runner);
    } else {
      rafId = setTimeout(runner, 0);
    }
  }

  function clear() {
    dirty.clear();
    scheduled = false;
    if (rafId !== null) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      else clearTimeout(rafId);
    }
    rafId = null;
  }

  return { schedule, flush, clear, get dirtyKeys() { return Array.from(dirty); } };
}
