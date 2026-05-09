import { demoData } from './demoData.js';

function deepClone(value) {
  return structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function createApiClient(config = {}) {
  const mode = config.baseUrl && config.baseUrl !== 'local://runtime' ? 'remote-ready' : 'local';
  return {
    mode,
    async bootstrap() {
      return deepClone(demoData);
    },
    async ping() {
      return { ok: true, mode };
    }
  };
}
