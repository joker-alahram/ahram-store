import { cn } from '@/ui/utils';

export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const classes = {
    default: 'bg-slate-50 text-slate-900',
    success: 'bg-emerald-50 text-emerald-900',
    warning: 'bg-amber-50 text-amber-900',
    danger: 'bg-rose-50 text-rose-900',
  };
  return (
    <div className={cn('rounded-2xl p-4 ring-1 ring-slate-200/70', classes[tone])}>
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
