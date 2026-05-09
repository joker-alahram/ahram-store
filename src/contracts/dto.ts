import type {
  AppSettings,
  CartItem,
  Customer,
  Invoice,
  Order,
  OrderItem,
  Product,
  SalesRep,
  SummaryMetric,
  Tier,
  RuntimeSession,
  RuntimeHealth,
  Offer,
} from './types';
import type { ApiErrorResponse } from './errors';

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    request_id?: string;
    correlation_id?: string;
    version?: string;
  };
  error?: ApiErrorResponse['error'];
}

export interface LoginResponseDTO {
  session: RuntimeSession;
  user: Customer | SalesRep | { id: string; user_type: 'admin'; name: string };
}

export interface RestoreSessionResponseDTO {
  session: RuntimeSession | null;
  user: LoginResponseDTO['user'] | null;
}

export interface GetAppSettingsResponseDTO {
  settings: AppSettings;
}

export interface ListProductsResponseDTO {
  products: Product[];
}

export interface GetProductResponseDTO {
  product: Product;
}

export interface ListTiersResponseDTO {
  tiers: Tier[];
}

export interface ListCustomersResponseDTO {
  customers: Customer[];
}

export interface GetCustomerResponseDTO {
  customer: Customer;
}

export interface ListRepsResponseDTO {
  reps: SalesRep[];
}

export interface ListOrdersResponseDTO {
  orders: Order[];
}

export interface GetOrderResponseDTO {
  order: Order;
}

export interface ListOffersResponseDTO {
  offers: Offer[];
}

export interface ListMetricsResponseDTO {
  metrics: SummaryMetric[];
}

export interface RuntimeHealthResponseDTO {
  health: RuntimeHealth;
}

export interface CartResponseDTO {
  items: CartItem[];
  subtotal: number;
  grand_total: number;
  tier_name: string;
}

export interface CheckoutResponseDTO {
  order: Order;
  invoice: Invoice;
  whatsapp_text: string;
}

export interface AuditRecordDTO {
  id: string;
  actor_id: string;
  actor_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_snapshot: unknown;
  after_snapshot: unknown;
  created_at: string;
}
