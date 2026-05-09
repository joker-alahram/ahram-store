import { motion } from 'framer-motion';
import { Plus, ShieldCheck, ShoppingCart } from 'lucide-react';
import type { Product } from '@/contracts/types';
import { Badge } from './Badge';
import { money } from '@/utils/money';
import { useAppStore } from '@/state/useAppStore';
import { cn } from '@/ui/utils';

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useAppStore((s) => s.addToCart);
  const openTier = useAppStore((s) => s.toggleTierModal);
  const tier = useAppStore((s) => s.cart.tier_name);
  const unit = product.units.find((u) => u.tier_name === tier) ?? product.units[0];
  const stockTone = unit?.available_qty && unit.available_qty > 0 ? 'success' : 'danger';

  return (
    <motion.article whileHover={{ y: -3 }} className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200/70">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50">
        <img src={product.image_url ?? 'https://placehold.co/600x400/png?text=Product'} alt={product.product_name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <Badge tone={stockTone}>{unit?.runtime_healthy ? 'runtime healthy' : 'runtime warning'}</Badge>
          <div className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">{product.company_name}</div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">{product.product_name}</h3>
          <p className="mt-1 text-xs text-slate-500">{product.category_name ?? 'Category'} • {product.product_id}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(product.badges ?? []).slice(0, 3).map((badge) => <Badge key={badge}>{badge}</Badge>)}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Tier price</div>
            <div className="text-xl font-semibold text-slate-900">{money(unit?.final_price ?? 0)}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>{unit?.unit_code}</div>
            <div>{unit?.available_qty?.toLocaleString('en-US')} available</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openTier(true)}
            className={cn('inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100')}
          >
            <ShieldCheck size={16} />
            Tier
          </button>
          <button
            onClick={() => addToCart(product.id, unit?.unit_code ?? 'carton', 1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
