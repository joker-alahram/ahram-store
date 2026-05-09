import { useMemo, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Grid2x2, Store, PackageSearch, Sparkles, Search as SearchIcon, LogIn, UserPlus, ShoppingCart, FileText, Users, Crown, BarChart3, Shield, History, ReceiptText, Wrench, TriangleAlert } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { SectionCard } from '@/ui/components/SectionCard';
import { MetricCard } from '@/ui/components/MetricCard';
import { ProductCard } from '@/ui/components/ProductCard';
import { Badge } from '@/ui/components/Badge';
import { money } from '@/utils/money';
import { formatDateTime } from '@/utils/date';
import { EmptyState } from '@/ui/components/EmptyState';

const routeMeta: Record<string, { title: string; icon: ReactNode; description: string }> = {
  '/': { title: 'Home', icon: <Grid2x2 size={16} />, description: 'Fast B2B commerce surface' },
  '/companies': { title: 'Companies', icon: <Store size={16} />, description: 'Browse company-owned assortments' },
  '/products': { title: 'Products', icon: <PackageSearch size={16} />, description: 'Searchable runtime catalog' },
  '/offers': { title: 'Offers', icon: <Sparkles size={16} />, description: 'Isolated daily deals and flash offers' },
  '/search': { title: 'Search', icon: <SearchIcon size={16} />, description: 'Instant query surface' },
  '/login': { title: 'Login', icon: <LogIn size={16} />, description: 'Authentication runtime' },
  '/register': { title: 'Register', icon: <UserPlus size={16} />, description: 'Customer creation runtime' },
  '/cart': { title: 'Cart', icon: <ShoppingCart size={16} />, description: 'Persistent commerce draft' },
  '/checkout': { title: 'Checkout', icon: <FileText size={16} />, description: 'Authoritative order orchestration' },
  '/orders': { title: 'Orders', icon: <ReceiptText size={16} />, description: 'Order and status history' },
  '/invoices': { title: 'Invoices', icon: <FileText size={16} />, description: 'Immutable invoice snapshots' },
  '/profile': { title: 'Profile', icon: <UserPlus size={16} />, description: 'Account and runtime context' },
  '/rep/customers': { title: 'Rep Customers', icon: <Users size={16} />, description: 'Representative portfolio' },
  '/rep/orders': { title: 'Rep Orders', icon: <ReceiptText size={16} />, description: 'Representative order trail' },
  '/rep/create-customer': { title: 'Create Customer', icon: <UserPlus size={16} />, description: 'Rep customer onboarding' },
  '/rep/portfolio': { title: 'Rep Portfolio', icon: <Crown size={16} />, description: 'Ownership and activity view' },
  '/admin': { title: 'Admin', icon: <Shield size={16} />, description: 'Governance dashboard' },
  '/admin/products': { title: 'Admin Products', icon: <PackageSearch size={16} />, description: 'Catalog governance' },
  '/admin/pricing': { title: 'Admin Pricing', icon: <Wrench size={16} />, description: 'Authoritative pricing control' },
  '/admin/orders': { title: 'Admin Orders', icon: <ReceiptText size={16} />, description: 'Operational order control' },
  '/admin/customers': { title: 'Admin Customers', icon: <Users size={16} />, description: 'Customer management' },
  '/admin/reps': { title: 'Admin Reps', icon: <Crown size={16} />, description: 'Representative management' },
  '/admin/offers': { title: 'Admin Offers', icon: <Sparkles size={16} />, description: 'Offer lifecycle control' },
  '/admin/analytics': { title: 'Admin Analytics', icon: <BarChart3 size={16} />, description: 'Behavior and conversion metrics' },
  '/admin/audit': { title: 'Admin Audit', icon: <History size={16} />, description: 'Immutable traceability' },
};

export function ScreenPage() {
  const location = useLocation();
  const path = location.pathname;
  const meta = routeMeta[path] ?? { title: 'Runtime', icon: <Grid2x2 size={16} />, description: 'Composed runtime view' };

  const settings = useAppStore((s) => s.catalog.settings);
  const health = useAppStore((s) => s.catalog.health);
  const products = useAppStore((s) => s.catalog.products);
  const tiers = useAppStore((s) => s.catalog.tiers);
  const offers = useAppStore((s) => s.catalog.offers);
  const orders = useAppStore((s) => s.invoices.invoices);
  const customers = useAppStore((s) => s.catalog.customers);
  const reps = useAppStore((s) => s.catalog.reps);
  const user = useAppStore((s) => s.auth.user);
  const session = useAppStore((s) => s.auth.session);
  const cart = useAppStore((s) => s.cart);
  const login = useAppStore((s) => s.login);
  const addToCart = useAppStore((s) => s.addToCart);
  const selectCustomer = useAppStore((s) => s.selectCustomer);
  const createCustomer = useAppStore((s) => s.createCustomer);
  const submitCheckout = useAppStore((s) => s.submitCheckout);
  const refreshOrders = useAppStore((s) => s.refreshOrders);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const setSearch = useAppStore((s) => s.setSearch);
  const toggleCart = useAppStore((s) => s.toggleCart);

  const featured = useMemo(() => products.slice(0, 4), [products]);
  const revenue = orders.reduce((sum, invoice) => sum + invoice.grand_total, 0);
  const totals = [
    { label: 'Catalog items', value: String(products.length), tone: 'default' as const },
    { label: 'Active tiers', value: String(tiers.length), tone: 'success' as const },
    { label: 'Offers', value: String(offers.length), tone: 'warning' as const },
    { label: 'Revenue', value: money(revenue), tone: 'success' as const },
  ];

  const renderMain = () => {
    if (path === '/login') {
      return (
        <SectionCard className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Use admin / M2020m, representative usernames from seed data, or customer phone numbers.</p>
          <form className="mt-4 grid gap-3" onSubmit={async (e) => { e.preventDefault(); const form = new FormData(e.currentTarget); await login(String(form.get('login')), String(form.get('password'))); }}>
            <input name="login" placeholder="Phone or username" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <input name="password" type="password" placeholder="Password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Authenticate</button>
          </form>
        </SectionCard>
      );
    }

    if (path === '/register' || path === '/rep/create-customer') {
      return (
        <SectionCard className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Create customer</h2>
          <form className="mt-4 grid gap-3" onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            await createCustomer({
              name: String(form.get('name')),
              phone: String(form.get('phone')),
              username: String(form.get('username')),
              password: String(form.get('password') || ''),
            });
            e.currentTarget.reset();
          }}>
            <input name="name" placeholder="Customer name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <input name="phone" placeholder="Phone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <input name="username" placeholder="Username" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <input name="password" placeholder="Password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <button className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Create</button>
          </form>
        </SectionCard>
      );
    }

    if (path === '/products' || path === '/' || path === '/search') {
      return (
        <div className="space-y-5">
          {path === '/' ? (
            <SectionCard className="overflow-hidden">
              <div className="grid gap-4 p-5 md:grid-cols-[1.3fr_.7fr]">
                <div className="space-y-3">
                  <Badge tone="success">Enterprise mobile runtime</Badge>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Premium B2B ordering shell with authoritative contracts</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">Render-only frontend, backend-authoritative pricing, immutable order snapshots, and mobile-first execution across customer, rep, and admin flows.</p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/products" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Browse catalog</Link>
                    <button onClick={() => toggleCart(true)} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Open cart</button>
                  </div>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-slate-900 p-5 text-white shadow-lift">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/80">Runtime health</div>
                  <div className="mt-2 text-2xl font-semibold">{health?.runtime_healthy ? 'Stable' : 'Degraded'}</div>
                  <div className="mt-4 grid gap-2 text-sm text-white/90">
                    <div>Pricing: {health?.pricing_healthy ? 'Authoritative' : 'Offline'}</div>
                    <div>Inventory: {health?.inventory_healthy ? 'Validated' : 'Pending'}</div>
                    <div>Auth: {health?.auth_healthy ? 'Ready' : 'Blocked'}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {totals.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />)}
          </div>

          <SectionCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Featured products</h2>
                <p className="text-sm text-slate-500">Filtered by current tier and query state.</p>
              </div>
              <Link to="/products" className="text-sm font-medium text-emerald-700">View all</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </SectionCard>
        </div>
      );
    }

    if (path === '/companies') {
      const grouped = products.reduce<Record<string, typeof products>>((acc, item) => {
        (acc[item.company_name] ||= []).push(item);
        return acc;
      }, {});
      return (
        <div className="space-y-4">
          {Object.entries(grouped).map(([company, items]) => (
            <SectionCard key={company} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{company}</h2>
                  <p className="text-sm text-slate-500">{items.length} products</p>
                </div>
                <button onClick={() => selectCompany(items[0]?.company_id ?? null)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Open</button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {items.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </SectionCard>
          ))}
        </div>
      );
    }

    if (path === '/offers') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer) => (
            <SectionCard key={offer.id} className="p-5">
              <Badge tone={offer.type === 'flash_offer' ? 'warning' : 'success'}>{offer.type}</Badge>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{offer.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{offer.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Independent offer price</div>
                  <div className="text-2xl font-semibold text-slate-950">{money(offer.price)}</div>
                </div>
                <button onClick={() => addToCart(offer.product_id ?? 'p2', 'carton', 1, offer.id)} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Add</button>
              </div>
              <div className="mt-4 text-xs text-slate-500">Valid until {formatDateTime(offer.valid_to)}</div>
            </SectionCard>
          ))}
        </div>
      );
    }

    if (path === '/cart') {
      return (
        <SectionCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cart runtime</h2>
              <p className="text-sm text-slate-500">Persistent and locally optimistic, but financially authoritative at checkout.</p>
            </div>
            <button onClick={() => toggleCart(true)} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Open drawer</button>
          </div>
          <div className="mt-4 space-y-3">
            {cart.items.length ? cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.unit_code} • {item.quantity} • {money(item.unit_price)}</div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{money(item.line_total)}</div>
              </div>
            )) : <EmptyState title="Cart is empty" description="Add products from the catalog or offers to continue." />}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <span>Total</span>
            <span className="font-semibold">{money(cart.grand_total)}</span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <button onClick={() => toggleCart(true)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Quick review</button>
            <Link to="/checkout" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200">Go to checkout</Link>
          </div>
        </SectionCard>
      );
    }

    if (path === '/checkout') {
      return (
        <SectionCard className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Checkout orchestration</h2>
          <p className="mt-1 text-sm text-slate-500">This command is validated against session, tier, customer ownership, and inventory policy before commit.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Customer: {customers.find((c) => c.id === cart.selectedCustomerId)?.name ?? 'No customer selected'}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Tier: {cart.tier_name}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Items: {cart.items.length}
            </div>
            <button
              onClick={async () => { await submitCheckout('Created from mobile runtime'); await refreshOrders(); }}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Confirm order
            </button>
          </div>
        </SectionCard>
      );
    }

    if (path === '/orders' || path === '/invoices') {
      return (
        <div className="space-y-4">
          {orders.length ? orders.map((invoice) => (
            <SectionCard key={invoice.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{invoice.invoice_number}</div>
                  <div className="text-xs text-slate-500">{invoice.customer_name}</div>
                </div>
                <Badge tone="success">{invoice.status}</Badge>
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">{money(invoice.grand_total)}</div>
              <div className="mt-2 text-xs text-slate-500">Immutable snapshot • {formatDateTime(invoice.created_at)}</div>
            </SectionCard>
          )) : <EmptyState title="No records" description="Create an order to populate the history and invoice views." />}
        </div>
      );
    }

    if (path === '/profile') {
      return (
        <SectionCard className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Profile & session</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">Actor: {user ? (user as any).name ?? user.id : 'Guest'}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Role: {session?.user_type ?? 'guest'}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Session: {session?.session_id ?? '-'}</div>
          </div>
        </SectionCard>
      );
    }

    if (path === '/rep/customers' || path === '/rep/portfolio') {
      return (
        <div className="space-y-4">
          <SectionCard className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">Representative portfolio</h2>
            <p className="mt-1 text-sm text-slate-500">Customer ownership is explicit and traceable.</p>
          </SectionCard>
          <div className="grid gap-3 md:grid-cols-2">
            {customers.map((customer) => (
              <button key={customer.id} onClick={() => selectCustomer(customer.id)} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-soft">
                <div className="text-sm font-semibold text-slate-900">{customer.name}</div>
                <div className="mt-1 text-xs text-slate-500">{customer.phone} • {customer.customer_type}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (path === '/rep/orders') {
      return (
        <SectionCard className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Rep order trail</h2>
          <div className="mt-4 space-y-3">
            {orders.length ? orders.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">{invoice.invoice_number}</div>
                <div className="text-xs text-slate-500">{invoice.customer_name}</div>
              </div>
            )) : <EmptyState title="No rep orders" description="Orders created by the representative will appear here." />}
          </div>
        </SectionCard>
      );
    }

    if (path.startsWith('/admin')) {
      return (
        <div className="space-y-4">
          <SectionCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Admin governance</h2>
                <p className="text-sm text-slate-500">Pricing, catalog, orders, reps, customers, analytics, and audit visibility.</p>
              </div>
              <Badge tone={health?.runtime_healthy ? 'success' : 'danger'}>{health?.runtime_healthy ? 'Healthy' : 'Degraded'}</Badge>
            </div>
          </SectionCard>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Products" value={String(products.length)} />
            <MetricCard label="Customers" value={String(customers.length)} tone="success" />
            <MetricCard label="Reps" value={String(reps.length)} tone="warning" />
            <MetricCard label="Orders" value={String(orders.length)} tone="default" />
          </div>

          <SectionCard className="p-5">
            <h3 className="text-base font-semibold text-slate-900">Runtime policy snapshot</h3>
            <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">Frontend pricing authority: forbidden</div>
              <div className="rounded-2xl bg-slate-50 p-4">Inventory truth: backend authoritative</div>
              <div className="rounded-2xl bg-slate-50 p-4">Invoices: immutable after confirmation</div>
              <div className="rounded-2xl bg-slate-50 p-4">Orders: editable before confirmation only</div>
            </div>
          </SectionCard>
        </div>
      );
    }

    return (
      <SectionCard className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">{meta.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
      </SectionCard>
    );
  };

  return (
    <div className="space-y-4 pb-28">
      <SectionCard className="p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">{meta.icon}<span>{meta.description}</span></div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{meta.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Route: {path}</p>
      </SectionCard>

      <div className="grid gap-3 md:grid-cols-2">
        <SectionCard className="p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Session</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{session?.session_id ?? 'guest'}</div>
        </SectionCard>
        <SectionCard className="p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current customer</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{customers.find((c) => c.id === cart.selectedCustomerId)?.name ?? 'None'}</div>
        </SectionCard>
      </div>

      {renderMain()}
    </div>
  );
}
