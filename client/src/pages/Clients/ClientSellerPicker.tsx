import { SELLER_OPTIONS } from '@/api/clients.api';
import { Label } from '@/components/ui/label';

interface ClientSellerPickerProps {
  selected: string[];
  onChange: (domains: string[]) => void;
}

export function ClientSellerPicker({ selected, onChange }: ClientSellerPickerProps) {
  const allSelected = selected.length === 0;

  function toggle(domain: string) {
    if (selected.length === 0) {
      onChange(SELLER_OPTIONS.map((seller) => seller.value).filter((item) => item !== domain));
      return;
    }
    if (selected.includes(domain)) {
      onChange(selected.filter((item) => item !== domain));
      return;
    }
    const next = [...selected, domain];
    onChange(next.length === SELLER_OPTIONS.length ? [] : next);
  }

  function selectAll() {
    onChange([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label>Źródła wyszukiwania produktów</Label>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          Wszystkie ({SELLER_OPTIONS.length})
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Skąd pobieramy opisy, zdjęcia i dane produktu po EAN — <strong>nie dotyczy publikacji na Allegro</strong>.{' '}
        {allSelected
          ? 'Aktualnie: szukaj we wszystkich źródłach.'
          : `Wybrano ${selected.length} źródeł.`}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {SELLER_OPTIONS.map((seller) => {
          const checked = allSelected || selected.includes(seller.value);
          return (
            <label
              key={seller.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-surface-muted px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(seller.value)}
                className="h-4 w-4 rounded border-stone-300 text-primary-600"
              />
              <span className="text-ink">{seller.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
