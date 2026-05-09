import { cn } from '@/ui/utils';

import type { ReactNode } from 'react';

export function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl bg-white/95 shadow-soft ring-1 ring-slate-200/70 backdrop-blur', className)}>{children}</section>;
}
