import type { CommerceGateway } from './commerceGateway';
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
  ChangePasswordCommand,
  CreateCustomerCommand,
  EditOrderItemsCommand,
  LoginCommand,
  LogoutCommand,
  ReassignCustomersCommand,
  RestoreSessionCommand,
  SelectTierCommand,
  SubmitCheckoutCommand,
  UpdateCustomerCommand,
  UpdateOrderStatusCommand,
} from '@/contracts/commands';
import { companies, seed } from '@/mock/data';
import { uid } from '@/utils/id';
import { safeStorage } from '@/utils/storage';

type DbShape = {
  settings: AppSettings;
  tiers: Tier[];
  products: Product[];
  offers: Offer[];
  customers: Customer[];
  reps: SalesRep[];
  orders: Order[];
  health: RuntimeHealth;
  passwords: Record<string, string>;
  session: RuntimeSession | null;
};

const DB_KEY = 'runtime.db.v1';

const createDb = (): DbShape => ({
  settings: seed.settings,
  tiers: seed.tiers,
  products: seed.products,
  offers: seed.offers,
  customers: seed.customers,
  reps: seed.reps,
  orders: seed.orders,
  health: seed.health,
  passwords: {
    admin: 'M2020m',
    '01120000003': '123456',
    '01120000008': '123456',
    '01120000009': '2020',
    '01110000001': '1234',
    '01110000002': '1234',
    '01066197015': '123456',
    '01666197010': '123456',
  },
  session: null,
});

const ensureDb = (): DbShape => {
  const fallback = createDb();
  const stored = safeStorage.get<DbShape>(globalThis.localStorage, DB_KEY, fallback);
  return {
    ...fallback,
    ...stored,
    products: stored.products?.length ? stored.products : fallback.products,
    orders: stored.orders ?? [],
    customers: stored.customers?.length ? stored.customers : fallback.customers,
    reps: stored.reps?.length ? stored.reps : fallback.reps,
    offers: stored.offers?.length ? stored.offers : fallback.offers,
    session: stored.session ?? null,
  };
};

const persistDb = (db: DbShape) => safeStorage.set(globalThis.localStorage, DB_KEY, db);

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T,>(value: T): T => structuredClone(value);

const now = () => new Date().toISOString();

const money = (n: number) => n;

const customerNameFor = (db: DbShape, customerId: string) =>
  db.customers.find((item) => item.id === customerId)?.name ?? 'Unknown customer';

const repNameFor = (db: DbShape, repId: string | null | undefined) =>
  db.reps.find((item) => item.id === repId)?.name ?? null;

const findUser = (db: DbShape, login: string) => {
  if (login === 'admin') return { id: 'admin', user_type: 'admin' as const, name: 'System Administrator', password: db.passwords.admin };
  const rep = db.reps.find((item) => item.phone === login || item.username === login || item.login_code === login);
  if (rep) return { ...rep, user_type: 'sales_rep' as const, password: db.passwords[rep.username] ?? '123456' };
  const customer = db.customers.find((item) => item.phone === login || item.username === login);
  if (customer) return { ...customer, user_type: 'customer' as const, password: db.passwords[customer.username] ?? '123456' };
  return null;
};

const createSession = (userId: string, userType: RuntimeSession['user_type'], isBlocked = false): RuntimeSession => ({
  session_id: uid('sess'),
  access_token: uid('token'),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  user_id: userId,
  user_type: userType,
  is_blocked: isBlocked,
});

export class MockCommerceGateway implements CommerceGateway {
  private db = ensureDb();

  private commit() {
    persistDb(this.db);
  }

  async login(command: LoginCommand) {
    await delay();
    const user = findUser(this.db, command.login) as any;
    if (!user) throw Object.assign(new Error('AUTH_INVALID_CREDENTIALS'), { code: 'AUTH_INVALID_CREDENTIALS' });
    if (user.is_blocked) throw Object.assign(new Error('AUTH_BLOCKED_USER'), { code: 'AUTH_BLOCKED_USER' });
    if (user.password !== command.password) throw Object.assign(new Error('AUTH_INVALID_CREDENTIALS'), { code: 'AUTH_INVALID_CREDENTIALS' });

    const session = createSession(user.id, user.user_type, user.is_blocked ?? false);
    this.db.session = session;
    this.commit();

    if (user.user_type === 'admin') return { session, user: { id: 'admin', user_type: 'admin' as const, name: 'System Administrator' } };
    if (user.user_type === 'sales_rep') {
      const { password: _password, ...rep } = user;
      return { session, user: { id: rep.id, user_type: 'sales_rep' as const, name: rep.name, phone: rep.phone, username: rep.username, login_code: rep.login_code, is_active: rep.is_active, is_blocked: rep.is_blocked } };
    }
    {
      const { password: _password, ...customer } = user;
      return { session, user: { id: customer.id, user_type: 'customer' as const, name: customer.name, phone: customer.phone, username: customer.username, customer_type: customer.customer_type, sales_rep_id: customer.sales_rep_id, is_active: customer.is_active, is_blocked: customer.is_blocked } };
    }
  }

  async logout() {
    await delay(80);
    this.db.session = null;
    this.commit();
  }

  async restoreSession(_command: RestoreSessionCommand) {
    await delay(100);
    const session = this.db.session;
    if (!session) return { session: null, user: null };
    if (session.user_type === 'admin') return { session, user: { id: 'admin', user_type: 'admin' as const, name: 'System Administrator' } };
    if (session.user_type === 'sales_rep') {
      const rep = this.db.reps.find((item) => item.id === session.user_id) ?? this.db.reps[0];
      return { session, user: rep ? { ...rep, user_type: 'sales_rep' as const } : null };
    }
    const customer = this.db.customers.find((item) => item.id === session.user_id) ?? this.db.customers[0];
    return { session, user: customer ? { ...customer, user_type: 'customer' as const } : null };
  }

  async changePassword(_command: ChangePasswordCommand) {
    await delay();
  }

  async getAppSettings() {
    await delay(50);
    return clone(this.db.settings);
  }

  async listTiers() {
    await delay(50);
    return clone(this.db.tiers);
  }

  async listProducts(query?: { search?: string; tier_name?: string; company_id?: string }) {
    await delay(120);
    const search = (query?.search ?? '').trim().toLowerCase();
    const tier = query?.tier_name ?? 'base';
    return clone(
      this.db.products.filter((item) => {
        const matchesSearch = !search || [item.product_name, item.company_name, item.category_name, item.product_id].join(' ').toLowerCase().includes(search);
        const matchesCompany = !query?.company_id || item.company_id === query.company_id;
        const matchesTier = item.units.some((unit) => unit.tier_name === tier);
        return matchesSearch && matchesCompany && matchesTier;
      }),
    );
  }

  async getProduct(product_id: string) {
    await delay(90);
    return clone(this.db.products.find((item) => item.id === product_id) ?? null);
  }

  async listOffers() {
    await delay(70);
    return clone(this.db.offers);
  }

  async listCustomers(scope?: { sales_rep_id?: string | null }) {
    await delay(90);
    if (scope?.sales_rep_id) return clone(this.db.customers.filter((item) => item.sales_rep_id === scope.sales_rep_id));
    return clone(this.db.customers);
  }

  async getCustomer(id: string) {
    await delay(50);
    return clone(this.db.customers.find((item) => item.id === id) ?? null);
  }

  async createCustomer(command: CreateCustomerCommand) {
    await delay();
    const customer: Customer = {
      id: uid('cust'),
      name: command.name,
      phone: command.phone,
      username: command.username,
      customer_type: command.customer_type ?? (command.sales_rep_id ? 'rep_customer' : 'direct'),
      sales_rep_id: command.sales_rep_id ?? null,
      is_active: true,
      is_blocked: false,
    };
    this.db.customers = [customer, ...this.db.customers];
    if (customer.sales_rep_id) {
      const mappingKey = `sales_rep_customer:${customer.sales_rep_id}`;
      const stored = safeStorage.get<Record<string, string[]>>(globalThis.localStorage, mappingKey, {});
      stored[customer.sales_rep_id] = [...(stored[customer.sales_rep_id] ?? []), customer.id];
      safeStorage.set(globalThis.localStorage, mappingKey, stored);
    }
    this.commit();
    return clone(customer);
  }

  async updateCustomer(command: UpdateCustomerCommand) {
    await delay();
    const idx = this.db.customers.findIndex((item) => item.id === command.id);
    if (idx < 0) throw Object.assign(new Error('RESOURCE_NOT_FOUND'), { code: 'RESOURCE_NOT_FOUND' });
    const updated = { ...this.db.customers[idx], ...command };
    this.db.customers[idx] = updated;
    this.commit();
    return clone(updated);
  }

  async listSalesReps() {
    await delay(80);
    return clone(this.db.reps);
  }

  async createSalesRep(command: { name: string; phone: string; username: string; password?: string }) {
    await delay();
    const rep: SalesRep = {
      id: uid('rep'),
      name: command.name,
      phone: command.phone,
      username: command.username,
      login_code: command.username,
      is_active: true,
      is_blocked: false,
    };
    this.db.reps = [rep, ...this.db.reps];
    this.db.passwords[rep.username] = command.password ?? '123456';
    this.commit();
    return clone(rep);
  }

  async updateSalesRep(command: { id: string; name?: string; phone?: string; username?: string; is_active?: boolean; is_blocked?: boolean }) {
    await delay();
    const idx = this.db.reps.findIndex((item) => item.id === command.id);
    if (idx < 0) throw Object.assign(new Error('RESOURCE_NOT_FOUND'), { code: 'RESOURCE_NOT_FOUND' });
    this.db.reps[idx] = { ...this.db.reps[idx], ...command };
    this.commit();
    return clone(this.db.reps[idx]);
  }

  async reassignCustomers(command: ReassignCustomersCommand) {
    await delay();
    this.db.customers = this.db.customers.map((customer) =>
      command.customer_ids.includes(customer.id) ? { ...customer, sales_rep_id: command.sales_rep_id, customer_type: 'rep_customer' } : customer,
    );
    this.commit();
  }

  async createOrder(command: SubmitCheckoutCommand & { customer_id: string; sales_rep_id?: string | null; tier_name: string; items: Array<{ product_id?: string; offer_id?: string; unit_code: string; quantity: number }> }) {
    await delay(160);
    const customer_name = customerNameFor(this.db, command.customer_id);
    const sales_rep_name = repNameFor(this.db, command.sales_rep_id ?? null);
    const items = command.items.map((item) => {
      const product = item.product_id ? this.db.products.find((p) => p.id === item.product_id) : undefined;
      const unit = product?.units.find((u) => u.unit_code === item.unit_code) ?? product?.units[0];
      const unit_price = item.offer_id
        ? (this.db.offers.find((o) => o.id === item.offer_id)?.price ?? unit?.final_price ?? 0)
        : (unit?.final_price ?? 0);
      const quantity = Math.max(1, item.quantity);
      return {
        id: uid('order_item'),
        product_id: item.product_id,
        offer_id: item.offer_id,
        product_name_snapshot: product?.product_name ?? 'Offer Item',
        unit_code_snapshot: (unit?.unit_code ?? 'carton') as any,
        tier_snapshot: command.tier_name,
        quantity,
        unit_price_snapshot: unit_price,
        line_total_snapshot: unit_price * quantity,
        pricing_snapshot: {
          product_name: product?.product_name ?? 'Offer Item',
          company_name: product?.company_name,
          category_name: product?.category_name,
          unit_code: unit?.unit_code ?? 'carton',
          tier_name: command.tier_name,
          final_price: unit_price,
        },
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.line_total_snapshot, 0);
    const order: Order = {
      id: uid('order'),
      order_number: `ORD-${Date.now().toString().slice(-8)}`,
      status: 'submitted',
      payment_status: 'unpaid',
      payment_method: command.payment_method ?? 'cod',
      customer_id: command.customer_id,
      customer_name,
      sales_rep_id: command.sales_rep_id ?? null,
      sales_rep_name,
      tier_name: command.tier_name,
      subtotal,
      discount_total: 0,
      grand_total: subtotal,
      currency: this.db.settings.currency,
      notes: command.notes,
      created_at: now(),
      updated_at: now(),
      items,
      snapshots: {
        immutable_after_confirmed: false,
        pricing_version: 'v1',
        inventory_version: 'v1',
        customer_version: 'v1',
      },
    };
    const invoice: Invoice = {
      id: uid('inv'),
      invoice_number: `INV-${Date.now().toString().slice(-8)}`,
      order_id: order.id,
      customer_name,
      sales_rep_name,
      grand_total: order.grand_total,
      currency: order.currency,
      status: 'draft',
      whatsapp_text: this.buildWhatsAppText(order),
      created_at: now(),
      immutable: true,
    };
    this.db.orders = [order, ...this.db.orders];
    this.commit();
    return { order: clone(order), invoice: clone(invoice), whatsapp_text: invoice.whatsapp_text };
  }

  async listOrders(scope?: { customer_id?: string | null; sales_rep_id?: string | null }) {
    await delay(110);
    return clone(
      this.db.orders.filter((order) => {
        const customerMatches = scope?.customer_id ? order.customer_id === scope.customer_id : true;
        const repMatches = scope?.sales_rep_id ? order.sales_rep_id === scope.sales_rep_id : true;
        return customerMatches && repMatches;
      }),
    );
  }

  async getOrder(id: string) {
    await delay(70);
    return clone(this.db.orders.find((item) => item.id === id) ?? null);
  }

  async updateOrderStatus(command: UpdateOrderStatusCommand) {
    await delay();
    const order = this.db.orders.find((item) => item.id === command.order_id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    order.status = command.status as any;
    order.updated_at = now();
    if (command.status === 'confirmed') order.snapshots.immutable_after_confirmed = true;
    this.commit();
    return clone(order);
  }

  async editOrderItems(command: EditOrderItemsCommand) {
    await delay();
    const order = this.db.orders.find((item) => item.id === command.order_id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    if (order.status !== 'submitted' && order.status !== 'draft') throw Object.assign(new Error('ORDER_ALREADY_FINALIZED'), { code: 'ORDER_ALREADY_FINALIZED' });
    order.items = command.items.map((item) => {
      const product = item.product_id ? this.db.products.find((p) => p.id === item.product_id) : undefined;
      const unit = product?.units.find((u) => u.unit_code === item.unit_code) ?? product?.units[0];
      const price = unit?.final_price ?? 0;
      return {
        id: uid('order_item'),
        product_id: item.product_id,
        offer_id: item.offer_id,
        product_name_snapshot: product?.product_name ?? 'Offer Item',
        unit_code_snapshot: (unit?.unit_code ?? 'carton') as any,
        tier_snapshot: order.tier_name,
        quantity: item.quantity,
        unit_price_snapshot: price,
        line_total_snapshot: price * item.quantity,
        pricing_snapshot: { product_name: product?.product_name, unit_code: unit?.unit_code, tier_name: order.tier_name, final_price: price },
      };
    });
    order.subtotal = order.items.reduce((sum, item) => sum + item.line_total_snapshot, 0);
    order.grand_total = order.subtotal;
    order.updated_at = now();
    this.commit();
    return clone(order);
  }

  async sendOrderWhatsApp(order_id: string) {
    await delay(80);
    const order = this.db.orders.find((item) => item.id === order_id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    return { whatsapp_text: this.buildWhatsAppText(order) };
  }

  async dashboardSummaries() {
    await delay(75);
    const totalOrders = this.db.orders.length;
    const totalCustomers = this.db.customers.length;
    const totalReps = this.db.reps.length;
    const totalRevenue = this.db.orders.reduce((sum, o) => sum + o.grand_total, 0);
    return [
      { label: 'Orders', value: String(totalOrders), tone: 'default' },
      { label: 'Customers', value: String(totalCustomers), tone: 'success' },
      { label: 'Representatives', value: String(totalReps), tone: 'warning' },
      { label: 'Revenue', value: `${totalRevenue.toLocaleString('en-US')} EGP`, tone: 'success' },
    ];
  }

  async repPerformance() {
    await delay(50);
    return [
      { label: 'Top rep', value: this.db.reps[0]?.name ?? '-', tone: 'success' },
      { label: 'Active portfolios', value: `${this.db.customers.filter((c) => c.sales_rep_id).length}`, tone: 'default' },
    ];
  }

  async customerTotals() {
    await delay(50);
    return [
      { label: 'Direct customers', value: `${this.db.customers.filter((c) => c.customer_type === 'direct').length}`, tone: 'default' },
      { label: 'Rep customers', value: `${this.db.customers.filter((c) => c.customer_type === 'rep_customer').length}`, tone: 'warning' },
    ];
  }

  async getRuntimeHealth() {
    await delay(40);
    return clone(this.db.health);
  }

  private buildWhatsAppText(order: Order): string {
    const lines = [
      `Order: ${order.order_number}`,
      `Customer: ${order.customer_name}`,
      order.sales_rep_name ? `Rep: ${order.sales_rep_name}` : null,
      `Status: ${order.status}`,
      `Total: ${order.grand_total.toLocaleString('en-US')} ${order.currency}`,
      '',
      'Items:',
      ...order.items.map((item) => `- ${item.product_name_snapshot} x${item.quantity} = ${item.line_total_snapshot.toLocaleString('en-US')}`),
    ].filter(Boolean);
    return lines.join('\n');
  }
}
