import { Home, Store, Tags, ShoppingCart, ReceiptText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '@/state/useAppStore';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/companies', label: 'Companies', icon: Store },
  { to: '/offers', label: 'Offers', icon: Tags },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
];

export function BottomNav() {
  const cartCount = useAppStore((s) => s.cart.items.length);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {item.label}
              {item.to === '/cart' && cartCount > 0 ? (
                <span className="absolute right-2 top-1 rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">{cartCount}</span>
              ) : null}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
