import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalyticsEvent, AppSettings, CartItem, Customer, Invoice, Offer, Order, Product, RuntimeHealth, RuntimeSession, SalesRep, Tier } from '@/contracts/types';
import { safeStorage } from '@/utils/storage';
import { uid } from '@/utils/id';
import { getRuntime } from '@/runtime/runtime';

type AuthState = {
  session: RuntimeSession | null;
  user: { id: string; user_type: 'admin' | 'sales_rep' | 'customer'; name: string } | Customer | SalesRep | null;
  status: 'idle' | 'loading' | 'authenticated' | 'guest';
};

type CatalogState = {
  settings: AppSettings | null;
  tiers: Tier[];
  products: Product[];
  offers: Offer[];
  customers: Customer[];
  reps: SalesRep[];
  health: RuntimeHealth | null;
  search: string;
  selectedCompanyId: string | null;
};

type CartState = {
  items: CartItem[];
  tier_name: string;
  tierConfirmed: boolean;
  selectedCustomerId: string | null;
  subtotal: number;
  grand_total: number;
};

type CheckoutState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  lastOrderId: string | null;
};

type InvoiceState = {
  invoices: Invoice[];
};

type NotificationState = {
  items: Array<{ id: string; title: string; body?: string; tone: 'default' | 'success' | 'warning' | 'danger'; created_at: string }>;
};

type UiState = {
  cartOpen: boolean;
  tierModalOpen: boolean;
};

type AnalyticsState = {
  events: AnalyticsEvent[];
};

type AppStore = {
  auth: AuthState;
  catalog: CatalogState;
  cart: CartState;
  checkout: CheckoutState;
  invoices: InvoiceState;
  notifications: NotificationState;
  ui: UiState;
  analytics: AnalyticsState;
  initApp: () => Promise<void>;
  restoreSession: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  selectCompany: (companyId: string | null) => void;
  selectTier: (tier_name: string) => Promise<void>;
  selectCustomer: (customerId: string | null) => Promise<void>;
  addToCart: (productId: string, unitCode?: string, quantity?: number, offerId?: string) => Promise<void>;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  toggleCart: (open?: boolean) => void;
  toggleTierModal: (open?: boolean) => void;
  createCustomer: (payload: { name: string; phone: string; username: string; password?: string }) => Promise<void>;
  createSalesRep: (payload: { name: string; phone: string; username: string; password?: string }) => Promise<void>;
  submitCheckout: (notes?: string) => Promise<void>;
  recordEvent: (event_type: string, payload?: Record<string, unknown>) => void;
  refreshCatalog: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  setCustomersFromRepo: (customers: Customer[]) => void;
  setRepsFromRepo: (reps: SalesRep[]) => void;
  setOffersFromRepo: (offers: Offer[]) => void;
  setProductsFromRepo: (products: Product[]) => void;
  setOrdersFromRepo: (orders: Order[]) => void;
};

const persistKey = 'commerce.runtime.store.v1';

const computeTotals = (items: CartItem[]) => ({
  subtotal: items.reduce((sum, item) => sum + item.line_total, 0),
  grand_total: items.reduce((sum, item) => sum + item.line_total, 0),
});

const loadPersistedCart = (): { items: CartItem[]; tier_name: string; tierConfirmed: boolean; selectedCustomerId: string | null } => {
  if (typeof window === 'undefined') return { items: [], tier_name: 'base', tierConfirmed: false, selectedCustomerId: null };
  const raw = safeStorage.get<{ items?: CartItem[]; tier_name?: string; tierConfirmed?: boolean; selectedCustomerId?: string | null }>(window.localStorage, persistKey, {});
  return {
    items: raw.items ?? [],
    tier_name: raw.tier_name ?? 'base',
    tierConfirmed: raw.tierConfirmed ?? false,
    selectedCustomerId: raw.selectedCustomerId ?? null,
  };
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      auth: { session: null, user: null, status: 'idle' },
      catalog: { settings: null, tiers: [], products: [], offers: [], customers: [], reps: [], health: null, search: '', selectedCompanyId: null },
      cart: { ...loadPersistedCart(), subtotal: 0, grand_total: 0 },
      checkout: { status: 'idle', lastOrderId: null },
      invoices: { invoices: [] },
      notifications: { items: [] },
      ui: { cartOpen: false, tierModalOpen: false },
      analytics: { events: [] },

      initApp: async () => {
        const runtime = getRuntime();
        set({ auth: { ...get().auth, status: 'loading' } });
        const [settings, tiers, offers, health] = await Promise.all([
          runtime.catalog.getAppSettings(),
          runtime.catalog.listTiers(),
          runtime.catalog.listOffers(),
          runtime.catalog.getRuntimeHealth(),
        ]);
        set((state) => ({
          catalog: { ...state.catalog, settings, tiers, offers, health },
        }));
        await get().restoreSession();
        await get().refreshCatalog();
        await get().refreshCustomers();
        await get().refreshOrders();
        await get().refreshMetrics();
      },

      restoreSession: async () => {
        const runtime = getRuntime();
        const res = await runtime.auth.restoreSession({ access_token: '' });
        set((state) => ({
          auth: {
            session: res.session,
            user: res.user,
            status: res.session ? 'authenticated' : 'guest',
          },
          cart: {
            ...state.cart,
            tier_name: state.cart.tier_name ?? 'base',
            tierConfirmed: state.cart.tierConfirmed ?? false,
            selectedCustomerId: state.cart.selectedCustomerId ?? null,
          },
        }));
      },

      login: async (login, password) => {
        const runtime = getRuntime();
        const res = await runtime.auth.login({ login, password });
        set({
          auth: { session: res.session, user: res.user as any, status: 'authenticated' },
          ui: { ...get().ui, cartOpen: false },
        });
        await get().refreshCustomers();
        await get().refreshOrders();
        await get().refreshMetrics();
      },

      logout: async () => {
        const runtime = getRuntime();
        const session = get().auth.session;
        if (session) await runtime.auth.logout({ session_id: session.session_id });
        set({
          auth: { session: null, user: null, status: 'guest' },
          cart: { items: [], tier_name: 'base', tierConfirmed: false, selectedCustomerId: null, ...computeTotals([]) },
          invoices: { invoices: [] },
          ui: { cartOpen: false, tierModalOpen: false },
        });
      },

      setSearch: async (search) => {
        set((state) => ({ catalog: { ...state.catalog, search } }));
        await get().refreshCatalog();
        get().recordEvent('search', { search });
      },

      selectCompany: (companyId) => {
        set((state) => ({ catalog: { ...state.catalog, selectedCompanyId: companyId } }));
        get().recordEvent('company_open', { companyId });
      },

      selectTier: async (tier_name) => {
        set((state) => ({ cart: { ...state.cart, tier_name, tierConfirmed: true } }));
        get().recordEvent('tier_selection', { tier_name });
        await get().refreshCatalog();
      },

      selectCustomer: async (customerId) => {
        set((state) => ({ cart: { ...state.cart, selectedCustomerId: customerId } }));
        get().recordEvent('customer_assignment', { customerId });
      },

      addToCart: async (productId, unitCode = 'carton', quantity = 1, offerId) => {
        const state = get();
        if (!state.cart.tierConfirmed) {
          set((s) => ({ ui: { ...s.ui, tierModalOpen: true } }));
          return;
        }
        const runtime = getRuntime();
        const product = offerId ? null : await runtime.catalog.getProduct(productId);
        const offer = offerId ? state.catalog.offers.find((item) => item.id === offerId) ?? null : null;
        const unit = product?.units.find((item) => item.unit_code === unitCode) ?? product?.units[0];
        const unit_price = offer ? offer.price : unit?.final_price ?? 0;
        const item: CartItem = {
          id: uid('cart'),
          kind: offerId ? (offer?.type === 'flash_offer' ? 'flash_offer' : 'daily_deal') : 'product',
          product_id: product?.id,
          offer_id: offer?.id,
          title: offer?.title ?? product?.product_name ?? 'Item',
          company_name: product?.company_name,
          unit_code: (unit?.unit_code ?? 'carton') as any,
          quantity,
          unit_price,
          line_total: unit_price * quantity,
          tier_name: state.cart.tier_name,
          price_snapshot: {
            product_name: product?.product_name ?? offer?.title ?? 'Item',
            company_name: product?.company_name,
            category_name: product?.category_name,
            unit_code: (unit?.unit_code ?? 'carton') as any,
            tier_name: state.cart.tier_name,
            final_price: unit_price,
          },
        };
        set((s) => {
          const items = [item, ...s.cart.items];
          return { cart: { ...s.cart, items, ...computeTotals(items) } };
        });
        get().recordEvent('add-to-cart', { productId, unitCode, quantity, offerId });
      },

      updateCartQuantity: (cartItemId, quantity) => {
        set((state) => {
          const items = state.cart.items.map((item) => item.id === cartItemId ? { ...item, quantity, line_total: item.unit_price * quantity } : item);
          return { cart: { ...state.cart, items, ...computeTotals(items) } };
        });
        get().recordEvent('quantity_change', { cartItemId, quantity });
      },

      removeCartItem: (cartItemId) => {
        set((state) => {
          const items = state.cart.items.filter((item) => item.id !== cartItemId);
          return { cart: { ...state.cart, items, ...computeTotals(items) } };
        });
        get().recordEvent('remove-from-cart', { cartItemId });
      },

      clearCart: () => set((state) => ({ cart: { ...state.cart, items: [], subtotal: 0, grand_total: 0 } })),

      toggleCart: (open) => set((state) => ({ ui: { ...state.ui, cartOpen: open ?? !state.ui.cartOpen } })),
      toggleTierModal: (open) => set((state) => ({ ui: { ...state.ui, tierModalOpen: open ?? !state.ui.tierModalOpen } })),

      createCustomer: async (payload) => {
        const runtime = getRuntime();
        const sales_rep_id = get().auth.user?.user_type === 'sales_rep' ? get().auth.user.id : null;
        const customer = await runtime.customers.createCustomer({ ...payload, sales_rep_id, customer_type: sales_rep_id ? 'rep_customer' : 'direct' });
        set((state) => ({ catalog: { ...state.catalog, customers: [customer, ...state.catalog.customers] } }));
        get().recordEvent('customer_creation', { customer_id: customer.id });
      },

      createSalesRep: async (payload) => {
        const runtime = getRuntime();
        const rep = await runtime.customers.createSalesRep(payload);
        set((state) => ({ catalog: { ...state.catalog, reps: [rep, ...state.catalog.reps] } }));
      },

      submitCheckout: async (notes) => {
        const state = get();
        const runtime = getRuntime();
        const user = state.auth.user;
        const customer_id = state.cart.selectedCustomerId ?? (state.auth.session?.user_type === 'customer' ? state.auth.session.user_id : null);
        if (!customer_id) throw new Error('Customer selection required');
        set((s) => ({ checkout: { ...s.checkout, status: 'submitting' } }));
        const result = await runtime.checkout.submit({
          customer_id,
          sales_rep_id: user?.user_type === 'sales_rep' ? user.id : null,
          tier_name: state.cart.tier_name,
          items: state.cart.items,
          notes,
          payment_method: 'cod',
        });
        set((state2) => ({
          checkout: { status: 'success', lastOrderId: result.order.id },
          invoices: { invoices: [{ ...result.invoice, status: 'shared' }, ...state2.invoices.invoices] },
          cart: { items: [], tier_name: state2.cart.tier_name, selectedCustomerId: state2.cart.selectedCustomerId, subtotal: 0, grand_total: 0 },
          ui: { ...state2.ui, cartOpen: false },
        }));
        get().recordEvent('checkout', { order_id: result.order.id });
        get().recordEvent('invoice_generation', { invoice_id: result.invoice.id });
        get().recordEvent('whatsapp_send', { order_id: result.order.id });
      },

      recordEvent: (event_type, payload = {}) => {
        const state = get();
        const event = {
          event_id: uid('evt'),
          event_type,
          actor_id: state.auth.session?.user_id ?? null,
          actor_type: state.auth.session?.user_type ?? null,
          session_id: state.auth.session?.session_id ?? null,
          customer_id: state.cart.selectedCustomerId,
          representative_id: state.auth.session?.user_type === 'sales_rep' ? state.auth.session.user_id : null,
          timestamp: new Date().toISOString(),
          payload,
          source: 'ui',
          device_context: {
            user_agent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            locale: navigator.language,
          },
          runtime_context: {
            route: window.location.pathname,
            tier_name: state.cart.tier_name,
            customer_name: state.catalog.customers.find((c) => c.id === state.cart.selectedCustomerId)?.name ?? null,
          },
          correlation_id: uid('corr'),
        };
        set((state2) => ({ analytics: { events: [event, ...state2.analytics.events].slice(0, 250) } }));
      },

      refreshCatalog: async () => {
        const runtime = getRuntime();
        const [products, customers, reps] = await Promise.all([
          runtime.catalog.listProducts({
            search: get().catalog.search,
            tier_name: get().cart.tier_name,
            company_id: get().catalog.selectedCompanyId ?? undefined,
          }),
          runtime.customers.listCustomers(
            get().auth.session?.user_type === 'sales_rep' ? { sales_rep_id: get().auth.session.user_id } : undefined,
          ),
          runtime.customers.listSalesReps(),
        ]);
        set((state) => ({
          catalog: { ...state.catalog, products, customers, reps },
          cart: {
            ...state.cart,
            items: state.cart.items,
            ...computeTotals(state.cart.items),
          },
        }));
      },

      refreshOrders: async () => {
        const runtime = getRuntime();
        const scope = get().auth.session?.user_type === 'sales_rep'
          ? { sales_rep_id: get().auth.session.user_id }
          : get().auth.session?.user_type === 'customer'
            ? { customer_id: get().auth.session.user_id }
            : undefined;
        const orders = await runtime.orders.listOrders(scope);
        set((state) => ({ invoices: { invoices: orders.map((order) => ({
          id: `inv-${order.id}`,
          invoice_number: `INV-${order.order_number}`,
          order_id: order.id,
          customer_name: order.customer_name,
          sales_rep_name: order.sales_rep_name ?? null,
          grand_total: order.grand_total,
          currency: order.currency,
          status: 'shared',
          whatsapp_text: orders.length ? `Order ${order.order_number}\nTotal ${order.grand_total}` : '',
          created_at: order.created_at,
          immutable: true,
        })) } }));
        set((state) => ({ catalog: { ...state.catalog } }));
        if (orders.length) set((state) => ({ checkout: { ...state.checkout, lastOrderId: orders[0].id } }));
        set((state) => ({ cart: { ...state.cart, ...computeTotals(state.cart.items) } }));
      },

      refreshInvoices: async () => get().refreshOrders(),

      refreshCustomers: async () => {
        const runtime = getRuntime();
        const customers = await runtime.customers.listCustomers(
          get().auth.session?.user_type === 'sales_rep' ? { sales_rep_id: get().auth.session.user_id } : undefined,
        );
        set((state) => ({ catalog: { ...state.catalog, customers } }));
      },

      refreshMetrics: async () => {
        const runtime = getRuntime();
        const [summaries, repPerf, customerTotals] = await Promise.all([
          runtime.analytics.dashboardSummaries({ role: get().auth.session?.user_type ?? 'guest', actor_id: get().auth.session?.user_id ?? null }),
          runtime.analytics.repPerformance(),
          runtime.analytics.customerTotals(),
        ]);
        const events = summaries.map((m) => ({
          event_id: uid('metric'),
          event_type: 'route_change',
          actor_id: get().auth.session?.user_id ?? null,
          actor_type: get().auth.session?.user_type ?? null,
          session_id: get().auth.session?.session_id ?? null,
          customer_id: get().cart.selectedCustomerId,
          representative_id: get().auth.session?.user_type === 'sales_rep' ? get().auth.session.user_id : null,
          timestamp: new Date().toISOString(),
          payload: { summaries, repPerf, customerTotals },
          source: 'analytics',
          device_context: {
            user_agent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            locale: navigator.language,
          },
          runtime_context: {
            route: window.location.pathname,
            tier_name: get().cart.tier_name,
            customer_name: get().catalog.customers.find((c) => c.id === get().cart.selectedCustomerId)?.name ?? null,
          },
          correlation_id: uid('corr'),
        }));
        set((state) => ({ analytics: { events: [...events, ...state.analytics.events].slice(0, 250) } }));
      },

      setCustomersFromRepo: (customers) => set((state) => ({ catalog: { ...state.catalog, customers } })),
      setRepsFromRepo: (reps) => set((state) => ({ catalog: { ...state.catalog, reps } })),
      setOffersFromRepo: (offers) => set((state) => ({ catalog: { ...state.catalog, offers } })),
      setProductsFromRepo: (products) => set((state) => ({ catalog: { ...state.catalog, products } })),
      setOrdersFromRepo: (orders) => set((state) => ({ checkout: { ...state.checkout, lastOrderId: orders[0]?.id ?? null } })),
    }),
    {
      name: persistKey,
      partialize: (state) => ({
        cart: {
          items: state.cart.items,
          tier_name: state.cart.tier_name,
          tierConfirmed: state.cart.tierConfirmed,
          selectedCustomerId: state.cart.selectedCustomerId,
        },
        catalog: {
          search: state.catalog.search,
          selectedCompanyId: state.catalog.selectedCompanyId,
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = computeTotals(state.cart.items);
          state.cart.subtotal = totals.subtotal;
          state.cart.grand_total = totals.grand_total;
        }
      },
    },
  ),
);
