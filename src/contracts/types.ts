export type UserType = 'guest' | 'customer' | 'sales_rep' | 'admin';
export type Role = UserType;

export type UnitCode = 'carton' | 'pack' | 'piece' | 'half_pack';

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cod' | 'invoice_later';

export interface RuntimeSession {
  session_id: string;
  access_token: string;
  expires_at: string;
  user_id: string;
  user_type: UserType;
  is_blocked: boolean;
}

export interface AppSettings {
  banner_image: string;
  enable_pack_tier_discount: boolean;
  tier_scope: Record<string, { carton: boolean; pack: boolean }>;
  currency: string;
  support_whatsapp: string;
}

export interface Tier {
  id: string;
  tier_name: string;
  display_name: string;
  min_order: number;
  is_default: boolean;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  company_id?: string;
}

export interface ProductUnitPrice {
  unit_code: UnitCode;
  tier_name: string;
  final_price: number;
  available_qty: number;
  reserved_qty: number;
  allow_backorder: boolean;
  runtime_healthy: boolean;
  minimum_sell_qty: number;
  is_sellable: boolean;
}

export interface Product {
  id: string;
  product_id: string;
  product_name: string;
  company_id: string;
  company_name: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  units: ProductUnitPrice[];
  badges?: string[];
}

export interface Offer {
  id: string;
  type: 'daily_deal' | 'flash_offer';
  title: string;
  description?: string;
  price: number;
  product_id?: string;
  valid_from: string;
  valid_to: string;
  inventory_qty: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  user_type: 'customer';
  name: string;
  phone: string;
  username: string;
  customer_type: 'direct' | 'rep_customer';
  sales_rep_id: string | null;
  is_active: boolean;
  is_blocked: boolean;
}

export interface SalesRep {
  id: string;
  user_type: 'sales_rep';
  name: string;
  phone: string;
  username: string;
  login_code?: string;
  is_active: boolean;
  is_blocked: boolean;
}

export interface CartItem {
  id: string;
  kind: 'product' | 'daily_deal' | 'flash_offer';
  product_id?: string;
  offer_id?: string;
  title: string;
  company_name?: string;
  unit_code: UnitCode;
  quantity: number;
  unit_price: number;
  line_total: number;
  tier_name: string;
  price_snapshot: {
    product_name: string;
    company_name?: string;
    category_name?: string;
    unit_code: UnitCode;
    tier_name: string;
    final_price: number;
  };
}

export interface OrderItem {
  id: string;
  product_id?: string;
  offer_id?: string;
  product_name_snapshot: string;
  unit_code_snapshot: UnitCode;
  tier_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  line_total_snapshot: number;
  pricing_snapshot: Record<string, unknown>;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  customer_id: string;
  customer_name: string;
  sales_rep_id: string | null;
  sales_rep_name?: string | null;
  tier_name: string;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  snapshots: {
    immutable_after_confirmed: boolean;
    pricing_version: string;
    inventory_version: string;
    customer_version: string;
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  sales_rep_name?: string | null;
  grand_total: number;
  currency: string;
  status: 'draft' | 'sent' | 'shared';
  whatsapp_text: string;
  created_at: string;
  immutable: boolean;
}

export interface AnalyticsEvent {
  event_id: string;
  event_type: string;
  actor_id?: string | null;
  actor_type?: Role | null;
  session_id?: string | null;
  customer_id?: string | null;
  representative_id?: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
  source: string;
  device_context: {
    user_agent: string;
    viewport: string;
    locale: string;
  };
  runtime_context: {
    route: string;
    tier_name?: string | null;
    customer_name?: string | null;
  };
  correlation_id: string;
}

export interface RuntimeHealth {
  runtime_healthy: boolean;
  pricing_healthy: boolean;
  inventory_healthy: boolean;
  auth_healthy: boolean;
  last_checked_at: string;
}

export interface SummaryMetric {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}
