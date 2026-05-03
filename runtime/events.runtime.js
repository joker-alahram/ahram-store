let eventsBound = false;

export function installRuntimeEvents(bindings = {}) {
  if (eventsBound) return;
  eventsBound = true;

  const { onClick, onInput, onKeydown, onHashchange } = bindings;

  if (typeof onClick === 'function') document.addEventListener('click', onClick);
  if (typeof onInput === 'function') document.addEventListener('input', onInput);
  if (typeof onKeydown === 'function') document.addEventListener('keydown', onKeydown);
  if (typeof onHashchange === 'function') window.addEventListener('hashchange', onHashchange);
}

export function resetRuntimeEvents() {
  eventsBound = false;
}
