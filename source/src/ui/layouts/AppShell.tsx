import { Outlet } from 'react-router-dom';
import { StickyHeader } from '@/ui/components/StickyHeader';
import { BottomNav } from '@/ui/components/BottomNav';
import { TierModal } from '@/ui/components/TierModal';
import { CartDrawer } from '@/ui/components/CartDrawer';

export function AppShell() {
  return (
    <div className="min-h-screen bg-transparent">
      <StickyHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-24 md:px-6 lg:px-8">
        <Outlet />
      </main>
      <BottomNav />
      <TierModal />
      <CartDrawer />
    </div>
  );
}
