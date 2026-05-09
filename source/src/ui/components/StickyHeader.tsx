import { Search, ShoppingCart, UserCircle2, BadgePercent } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { Badge } from './Badge';

export function StickyHeader() {
  const search = useAppStore((s) => s.catalog.search);
  const setSearch = useAppStore((s) => s.setSearch);
  const tier = useAppStore((s) => s.cart.tier_name);
  const customer = useAppStore((s) => s.catalog.customers.find((c) => c.id === s.cart.selectedCustomerId));
  const toggleCart = useAppStore((s) => s.toggleCart);
  const openTier = useAppStore((s) => s.toggleTierModal);
  const user = useAppStore((s) => s.auth.user);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-soft">
            <BadgePercent size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">Enterprise B2B Runtime</div>
            <div className="truncate text-xs text-slate-500">{user ? (user as any).name ?? 'Guest' : 'Guest'} • {tier}</div>
          </div>
          <button onClick={() => openTier(true)} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            Tier
          </button>
          <button onClick={() => toggleCart(true)} className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-soft">
            <ShoppingCart size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 ring-1 ring-slate-200">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, companies, offers..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <button onClick={() => openTier(true)} className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
            {tier}
          </button>
          <button className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
            <UserCircle2 size={16} />
            {customer?.name ?? 'No customer'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="success">Render-only frontend</Badge>
          <Badge tone="default">Authoritative backend pricing</Badge>
          <Badge tone="warning">Mobile-first runtime</Badge>
        </div>
      </div>
    </header>
  );
}
