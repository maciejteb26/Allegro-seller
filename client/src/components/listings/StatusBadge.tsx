import { cn } from '@/lib/utils';
import { ListingStatus } from '@/types';

const STATUS_CONFIG: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Szkic', className: 'bg-gray-100 text-gray-700' },
  PUBLISHING: { label: 'Wystawianie...', className: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Aktywne', className: 'bg-green-100 text-green-700' },
  PARTIALLY_ACTIVE: { label: 'Częściowo aktywne', className: 'bg-yellow-100 text-yellow-700' },
  ENDED: { label: 'Zakończone', className: 'bg-gray-100 text-gray-500' },
  ERROR: { label: 'Błąd', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}
