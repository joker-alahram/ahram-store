import { MockCommerceGateway } from '@/gateways/mockCommerceGateway';
import { AuthRepository } from '@/repositories/authRepository';
import { CatalogRepository } from '@/repositories/catalogRepository';
import { CustomerRepository } from '@/repositories/customerRepository';
import { OrderRepository } from '@/repositories/orderRepository';
import { AnalyticsRepository } from '@/repositories/analyticsRepository';
import { AuthService } from '@/services/authService';
import { CatalogService } from '@/services/catalogService';
import { CustomerService } from '@/services/customerService';
import { OrderService } from '@/services/orderService';
import { CheckoutService } from '@/services/checkoutService';
import { AnalyticsService } from '@/services/analyticsService';
import { setRuntime } from '@/runtime/runtime';

export const bootstrapRuntime = () => {
  const gateway = new MockCommerceGateway();

  const authRepo = new AuthRepository(gateway);
  const catalogRepo = new CatalogRepository(gateway);
  const customerRepo = new CustomerRepository(gateway);
  const orderRepo = new OrderRepository(gateway);
  const analyticsRepo = new AnalyticsRepository(gateway);

  const auth = new AuthService(authRepo);
  const catalog = new CatalogService(catalogRepo);
  const customers = new CustomerService(customerRepo);
  const orders = new OrderService(orderRepo);
  const checkout = new CheckoutService(orders, customers);
  const analytics = new AnalyticsService(analyticsRepo);

  const runtime = {
    auth,
    catalog,
    customers,
    orders,
    checkout,
    analytics,
    bootedAt: new Date().toISOString(),
  };

  setRuntime(runtime);
  return runtime;
};
