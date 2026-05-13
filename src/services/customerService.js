import { storageKeys, saveJSON, removeValue, loadJSON } from '../core/storage.js';

export async function loadRepCustomers(api, repId) {
  if (!repId) return [];
  const rows = await api.get('v_rep_customers', {
    select: 'id,name,phone,address,location,username,created_at,sales_rep_id,created_by,customer_type',
    sales_rep_id: `eq.${repId}`,
    order: 'created_at.desc',
  }).catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

function sanitizeLocationPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };
  if (next.location_lat === '' || Number.isNaN(Number(next.location_lat))) delete next.location_lat;
  if (next.location_lng === '' || Number.isNaN(Number(next.location_lng))) delete next.location_lng;
  return next;
}

function isMissingLocationColumnError(error) {
  const message = String(error?.message || error?.error_description || error?.details || '').toLowerCase();
  return message.includes('location_lat') || message.includes('location_lng') || (message.includes('column') && message.includes('does not exist'));
}

export async function createCustomer(api, payload) {
  const primaryPayload = sanitizeLocationPayload(payload);
  try {
    const rows = await api.post('customers', primaryPayload).catch((error) => { throw error; });
    return Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    if (isMissingLocationColumnError(error) && ('location_lat' in primaryPayload || 'location_lng' in primaryPayload)) {
      const fallback = { ...primaryPayload };
      delete fallback.location_lat;
      delete fallback.location_lng;
      const rows = await api.post('customers', fallback).catch((fallbackError) => { throw fallbackError; });
      return Array.isArray(rows) ? rows[0] : rows;
    }
    throw error;
  }
}

export function persistSelectedCustomer(customer) {
  if (!customer) {
    removeValue(storageKeys.selectedCustomer);
    return;
  }
  saveJSON(storageKeys.selectedCustomer, customer);
}

export function loadSelectedCustomer() {
  return loadJSON(storageKeys.selectedCustomer, null);
}
