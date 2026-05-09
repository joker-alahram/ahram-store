import type { AnalyticsEvent } from './types';

export type EventType =
  | 'login'
  | 'logout'
  | 'registration'
  | 'session_restore'
  | 'search'
  | 'company_open'
  | 'product_click'
  | 'add-to-cart'
  | 'remove-from-cart'
  | 'quantity_change'
  | 'tier_selection'
  | 'checkout'
  | 'invoice_generation'
  | 'invoice_send'
  | 'whatsapp_send'
  | 'customer_creation'
  | 'customer_assignment'
  | 'representative_actions'
  | 'order_status_change'
  | 'route_change';

export type CommerceEvent = AnalyticsEvent;
