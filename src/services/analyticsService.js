import { storageKeys, loadJSON, saveJSON } from '../core/storage.js';

export function appendBehaviorEvent(type, payload = {}) {
  const current = loadJSON(storageKeys.behavior, []);
  const next = [...current, {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    type,
    ts: Date.now(),
    ...payload,
  }].slice(-1000);
  saveJSON(storageKeys.behavior, next);
  return next;
}

export async function writeUiEvent(api, event) {
  try {
    await api.post('ui_events', {
      visitor_id: event.visitor_id || null,
      session_id: event.session_id || null,
      user_id: event.user_id || null,
      customer_id: event.customer_id || null,
      rep_id: event.rep_id || null,
      event_type: event.event_type,
      entity_type: event.entity_type || null,
      entity_id: event.entity_id || null,
      page_key: event.page_key || null,
      action: event.action || null,
      payload: event.payload || {},
      created_at: new Date().toISOString(),
    });
  } catch {
    // best effort only
  }
}
