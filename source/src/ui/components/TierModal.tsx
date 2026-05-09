import { Check } from 'lucide-react';
import { SmartModal } from './SmartModal';
import { useAppStore } from '@/state/useAppStore';
import { money } from '@/utils/money';

export function TierModal() {
  const open = useAppStore((s) => s.ui.tierModalOpen);
  const close = useAppStore((s) => s.toggleTierModal);
  const tiers = useAppStore((s) => s.catalog.tiers);
  const selected = useAppStore((s) => s.cart.tier_name);
  const selectTier = useAppStore((s) => s.selectTier);

  return (
    <SmartModal open={open} title="Tier selection" onClose={() => close(false)}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">اختر الشريحة الفعالة. هذا الاختيار يضبط السعر النهائي من المصدر التنفيذي، وليس من الواجهة.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={async () => {
                await selectTier(tier.tier_name);
                close(false);
              }}
              className={`rounded-2xl border p-4 text-right transition ${
                selected === tier.tier_name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{tier.tier_name}</div>
                  <div className="mt-1 text-base font-semibold text-slate-900">{tier.display_name}</div>
                  <div className="mt-1 text-xs text-slate-500">Min order {money(tier.min_order)}</div>
                </div>
                {selected === tier.tier_name ? (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check size={16} />
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    </SmartModal>
  );
}
