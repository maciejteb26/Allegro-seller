import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { COMMON_PRODUCT_BRANDS } from '@/constants/product-brands';

interface Props {
  value?: string;
  onChange: (brand: string | undefined) => void;
}

function resolveDropdownDirection(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return window.innerHeight - rect.bottom < 320;
}

export function ProductBrandSelect({ value, onChange }: Props) {
  const [search, setSearch] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);

  const filtered = COMMON_PRODUCT_BRANDS.filter((brand) =>
    brand.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setSearch(value ?? '');
  }, [value]);

  return (
    <div>
      <Label className="mb-1 block text-sm font-medium">Marka produktu</Label>
      <div className="relative">
        <Input
          placeholder="Szukaj marki..."
          value={search}
          onFocus={(e) => {
            setOpenUpwards(resolveDropdownDirection(e.currentTarget));
            setOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value.trim() || undefined);
            setOpenUpwards(resolveDropdownDirection(e.currentTarget));
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && (
          <div
            className={cn(
              'absolute z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl',
              openUpwards ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {filtered.map((brand) => (
              <button
                key={brand}
                type="button"
                onMouseDown={() => {
                  onChange(brand === 'Inne / brak marki' ? undefined : brand);
                  setSearch(brand);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                  value === brand && 'bg-primary-50 font-medium text-primary-700',
                )}
              >
                {brand}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">
                Wpisz własną markę: <span className="font-medium">{search}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
