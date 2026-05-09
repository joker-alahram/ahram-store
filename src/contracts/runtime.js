export const ROLES = Object.freeze({
  GUEST: 'guest',
  CUSTOMER: 'customer',
  SALES_REP: 'sales_rep',
  ADMIN: 'admin'
});

export const ORDER_STATES = Object.freeze(['draft', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const PAYMENT_STATES = Object.freeze(['unpaid', 'partially_paid', 'paid', 'refunded', 'cancelled']);

export const AUTH_ERRORS = Object.freeze({
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  BLOCKED_USER: 'AUTH_BLOCKED_USER',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
});

export const EVENT_NAMES = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  SEARCH: 'search',
  PRODUCT_CLICK: 'product_click',
  COMPANY_OPEN: 'company_open',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  QUANTITY_CHANGE: 'quantity_change',
  CHECKOUT: 'checkout',
  ORDER_CREATION: 'order_creation',
  INVOICE_GENERATION: 'invoice_generation',
  INVOICE_SEND: 'invoice_send',
  WHATSAPP_SEND: 'whatsapp_send',
  CUSTOMER_CREATION: 'customer_creation',
  REPR_ACTION: 'representative_action'
});
