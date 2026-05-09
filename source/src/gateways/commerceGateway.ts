import type {
  AppSettings,
  Customer,
  Invoice,
  Order,
  Offer,
  Product,
  RuntimeHealth,
  RuntimeSession,
  SalesRep,
  SummaryMetric,
  Tier,
} from '@/contracts/types';
import type {
  AddToCartCommand,
  ChangePasswordCommand,
  ChangeQuantityCommand,
  CreateCustomerCommand,
  EditOrderItemsCommand,
  LoginCommand,
  LogoutCommand,
  ReassignCustomersCommand,
  RemoveFromCartCommand,
  RestoreSessionCommand,
  SelectTierCommand,
  SubmitCheckoutCommand,
  UpdateCustomerCommand,
  UpdateOrderStatusCommand,
} from '@/contracts/commands';

export interface CommerceGateway {
  login(command: LoginCommand): Promise<{ session: RuntimeSession; user: Customer | SalesRep | { id: string; user_type: 'admin'; name: string } }>;
  logout(command: LogoutCommand): Promise<void>;
  restoreSession(command: RestoreSessionCommand): Promise<{ session: RuntimeSession | null; user: Customer | SalesRep | { id: string; user_type: 'admin'; name: string } | null }>;
  changePassword(command: ChangePasswordCommand): Promise<void>;

  getAppSettings(): Promise<AppSettings>;
  listTiers(): Promise<Tier[]>;
  listProducts(query?: { search?: string; tier_name?: string; company_id?: string }): Promise<Product[]>;
  getProduct(product_id: string): Promise<Product | null>;
  listOffers(): Promise<Offer[]>;
  listCustomers(scope?: { sales_rep_id?: string | null }): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(command: CreateCustomerCommand): Promise<Customer>;
  updateCustomer(command: UpdateCustomerCommand): Promise<Customer>;
  listSalesReps(): Promise<SalesRep[]>;
  createSalesRep(command: { name: string; phone: string; username: string; password?: string }): Promise<SalesRep>;
  updateSalesRep(command: { id: string; name?: string; phone?: string; username?: string; is_active?: boolean; is_blocked?: boolean }): Promise<SalesRep>;
  reassignCustomers(command: ReassignCustomersCommand): Promise<void>;

  createOrder(command: SubmitCheckoutCommand & { customer_id: string; sales_rep_id?: string | null; tier_name: string; items: Array<{ product_id?: string; offer_id?: string; unit_code: string; quantity: number }> }): Promise<{ order: Order; invoice: Invoice; whatsapp_text: string }>;
  listOrders(scope?: { customer_id?: string | null; sales_rep_id?: string | null }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  updateOrderStatus(command: UpdateOrderStatusCommand): Promise<Order>;
  editOrderItems(command: EditOrderItemsCommand): Promise<Order>;
  sendOrderWhatsApp(order_id: string): Promise<{ whatsapp_text: string }>;

  dashboardSummaries(scope?: { role?: string; actor_id?: string | null }): Promise<SummaryMetric[]>;
  repPerformance(): Promise<SummaryMetric[]>;
  customerTotals(): Promise<SummaryMetric[]>;
  getRuntimeHealth(): Promise<RuntimeHealth>;
}
