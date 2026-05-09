import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { money } from '@/utils/money';
import { Badge } from './Badge';

export function CartDrawer() {
  const open = useAppStore((s) => s.ui.cartOpen);
  const close = useAppStore((s) => s.toggleCart);
  const items = useAppStore((s) => s.cart.items);
  const subtotal = useAppStore((s) => s.cart.subtotal);
  const grand_total = useAppStore((s) => s.cart.grand_total);
  const removeItem = useAppStore((s) => s.removeCartItem);
  const updateQty = useAppStore((s) => s.updateCartQuantity);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[65] bg-slate-950/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.aside
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 26 }}
            className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[2rem] bg-white shadow-lift ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Persistent cart</div>
                <div className="text-lg font-semibold text-slate-900">{items.length} items</div>
              </div>
              <button onClick={() => close(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[58vh] space-y-3 overflow-y-auto p-4">
              {items.length ? items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500">{item.company_name ?? 'Offer'} • {item.unit_code}</p>
                      <div className="mt-2"><Badge>{money(item.unit_price)}</Badge></div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-600 ring-1 ring-slate-200">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
                      <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} className="px-3 py-2 text-sm font-semibold">-</button>
                      <span className="min-w-10 px-3 py-2 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-3 py-2 text-sm font-semibold">+</button>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{money(item.line_total)}</div>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">Cart is empty</div>}
            </div>
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="mt-2 flex items-center justify-between text-lg font-semibold text-slate-900"><span>Total</span><span>{money(grand_total)}</span></div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
