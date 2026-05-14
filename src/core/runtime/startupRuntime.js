export function createStartupLifecycleController(store) {
  function setRuntimeLifecycle(patch) {
    const current = store.getState();
    store.patch({ runtime: { ...current.runtime, lifecycle: { ...current.runtime.lifecycle, ...patch } } }, { silent: true });
  }

  function setRuntimePhase(phase, extras = {}) {
    const current = store.getState();
    store.patch({ runtime: { ...current.runtime, lifecycle: { ...current.runtime.lifecycle, phase, ...extras } } }, { silent: true });
  }

  return { setRuntimeLifecycle, setRuntimePhase };
}
