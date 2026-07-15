import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAllegroCategories } from '@/api/platforms.api';

interface Props {
  categoryId?: string;
  categoryName?: string;
  onChange: (category: { id: string; name: string } | undefined) => void;
}

function resolveDropdownDirection(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return window.innerHeight - rect.bottom < 320;
}

// Uzupelnia automatyczne dopasowanie kategorii Allegro (po tytule) — do recznej korekty, gdy
// automat zawiedzie i spadnie na niepoprawna kategorie domyslna (patrz CATEGORY_FALLBACK_WARNING).
export function AllegroCategorySelect({ categoryId, categoryName, onChange }: Props) {
  const [search, setSearch] = useState(categoryName ?? '');
  const [open, setOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: categories = [], isFetching } = useQuery({
    queryKey: ['allegro-categories-search', debouncedSearch],
    queryFn: () => searchAllegroCategories(debouncedSearch),
    enabled: open && debouncedSearch.trim().length >= 3,
  });

  useEffect(() => {
    setSearch(categoryName ?? '');
  }, [categoryName]);

  return (
    <div>
      <Label className="mb-1 block text-sm font-medium">Kategoria Allegro (ręczna korekta)</Label>
      <div className="relative">
        <Input
          placeholder="Szukaj kategorii Allegro (min. 3 znaki)..."
          value={search}
          onFocus={(e) => {
            setOpenUpwards(resolveDropdownDirection(e.currentTarget));
            setOpen(true);
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value.trim()) onChange(undefined);
            setOpenUpwards(resolveDropdownDirection(e.currentTarget));
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && debouncedSearch.trim().length >= 3 && (
          <div
            className={cn(
              'absolute z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-xl',
              openUpwards ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {isFetching && <p className="px-4 py-3 text-sm text-gray-400">Szukam...</p>}
            {!isFetching &&
              categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onMouseDown={() => {
                    onChange({ id: category.id, name: category.name });
                    setSearch(category.name);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                    categoryId === category.id && 'bg-primary-50 font-medium text-primary-700',
                  )}
                >
                  {category.name}
                </button>
              ))}
            {!isFetching && categories.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">Brak dopasowań w kategoriach Allegro.</p>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Zostaw puste, aby system dopasował kategorię automatycznie na podstawie tytułu.
      </p>
    </div>
  );
}
