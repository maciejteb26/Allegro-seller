import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { VehicleMake } from '@/types';

interface Props {
  makes: VehicleMake[];
  selectedId?: string;
  onSelect: (makeId: string) => void;
}

function resolveDropdownDirection(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return window.innerHeight - rect.bottom < 320;
}

export function VehicleMakeSelect({ makes, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);

  const selected = makes.find((m) => m.id === selectedId);
  const filtered = makes.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setSearch(selected?.name ?? '');
  }, [selected?.name]);

  return (
    <div>
      <Label className="mb-1 block text-sm font-medium">Marka</Label>
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
            {filtered.map((make) => (
              <button
                key={make.id}
                type="button"
                onMouseDown={() => {
                  onSelect(make.id);
                  setSearch(make.name);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                  selectedId === make.id && 'bg-primary-50 font-medium text-primary-700',
                )}
              >
                {make.name}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Brak wyników</p>}
          </div>
        )}
      </div>
    </div>
  );
}
