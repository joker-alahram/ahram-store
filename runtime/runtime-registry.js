import { CONFIG, STORAGE, els, state, readJSON, writeJSON } from './state.runtime.js';

export const runtimeRegistry = Object.freeze({
  CONFIG,
  STORAGE,
  els,
  state,
  readJSON,
  writeJSON,
});
