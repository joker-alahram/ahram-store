export const uid = (prefix = ''): string => {
  const cryptoObj = globalThis.crypto;
  const core = typeof cryptoObj?.randomUUID === 'function'
    ? cryptoObj.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${core}` : core;
};
