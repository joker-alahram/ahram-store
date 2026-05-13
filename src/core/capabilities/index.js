export const CAPABILITIES = Object.freeze({
  ORDERS_CREATE: 'orders.create',
  ORDERS_APPROVE: 'orders.approve',
  RETURNS_APPROVE: 'returns.approve',
  RETURNS_RECEIVE: 'returns.receive',
  PAYROLL_MANAGE: 'payroll.manage',
  ATTENDANCE_OVERRIDE: 'attendance.override',
  SHIPMENT_DISPATCH: 'shipment.dispatch',
  SHIPMENT_PREPARE: 'shipment.prepare',
  SHIPMENT_REVIEW: 'shipment.review',
  DRIVERS_ASSIGN: 'drivers.assign',
  CUSTOMERS_MANAGE: 'customers.manage',
});

export function normalizeCapability(value) {
  return String(value || '').trim().toLowerCase();
}

export function createCapabilitySet(values = []) {
  return new Set((Array.isArray(values) ? values : [values]).map(normalizeCapability).filter(Boolean));
}

export function hasCapability(capabilities, value) {
  if (!capabilities) return false;
  const key = normalizeCapability(value);
  if (!key) return false;
  return typeof capabilities.has === 'function' ? capabilities.has(key) : Array.isArray(capabilities) && capabilities.map(normalizeCapability).includes(key);
}
