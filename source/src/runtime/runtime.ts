import type { AuthService } from '@/services/authService';
import type { CatalogService } from '@/services/catalogService';
import type { CustomerService } from '@/services/customerService';
import type { OrderService } from '@/services/orderService';
import type { CheckoutService } from '@/services/checkoutService';
import type { AnalyticsService } from '@/services/analyticsService';
import type { RuntimeSession, UserType } from '@/contracts/types';

export interface RuntimeContext {
  auth: AuthService;
  catalog: CatalogService;
  customers: CustomerService;
  orders: OrderService;
  checkout: CheckoutService;
  analytics: AnalyticsService;
  bootedAt: string;
}

let runtime: RuntimeContext | null = null;

export const setRuntime = (value: RuntimeContext) => { runtime = value; };
export const getRuntime = () => {
  if (!runtime) throw new Error('Runtime not initialized');
  return runtime;
};

export const getPrimaryRole = (session: RuntimeSession | null): UserType => session?.user_type ?? 'guest';
