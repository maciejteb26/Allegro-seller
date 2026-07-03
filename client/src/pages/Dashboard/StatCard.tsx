import type { ElementType, ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  trend?: string;
  trendPositive?: boolean;
  sub?: ReactNode;
}

export function StatCard({ label, icon: Icon, value, trend, trendPositive = true, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-warm-200 rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-2.5 text-sm text-ink-muted font-medium mb-3.5">
        <Icon className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
        {label}
      </div>
      <div className="text-[38px] font-extrabold tracking-tight text-ink leading-none">{value}</div>
      {trend && (
        <div className={`text-sm font-semibold mt-2 ${trendPositive ? 'text-green-600' : 'text-red-500'}`}>
          {trend}
        </div>
      )}
      {sub && <div className="mt-2">{sub}</div>}
    </div>
  );
}
