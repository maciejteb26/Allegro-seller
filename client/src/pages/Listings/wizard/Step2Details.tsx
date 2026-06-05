import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/categories.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WizardData } from './types';
import { Condition } from '@/types';
import { MIN_DESCRIPTION_LENGTH } from './constants';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  showValidation?: boolean;
}

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: 'NEW', label: 'Nowy', desc: 'Nieużywany, w oryginalnym opakowaniu' },
  { value: 'USED', label: 'Używany', desc: 'Sprawny, ślady użytkowania' },
  { value: 'DAMAGED', label: 'Uszkodzony', desc: 'Wymaga naprawy lub na części' },
];

const PART_SIDES = ['Lewa', 'Prawa', 'Nie dotyczy'];

export function Step2Details({ data, onChange, showValidation }: Props) {
  const missingCategory = showValidation && !data.categoryId;
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const { data: categoryTree = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const selectedParent = categoryTree.find((c) => c.id === selectedParentId);

  const children = selectedParent?.children ?? [];

  useEffect(() => {
    if (!data.categoryId || categoryTree.length === 0) return;
    const parentFromChild = categoryTree.find((parent) => parent.children?.some((child) => child.id === data.categoryId));
    if (parentFromChild) {
      setSelectedParentId(parentFromChild.id);
      return;
    }
    const parent = categoryTree.find((item) => item.id === data.categoryId);
    if (parent) setSelectedParentId(parent.id);
  }, [data.categoryId, categoryTree]);

  function handleParentChange(parentId: string) {
    setSelectedParentId(parentId);
    const parent = categoryTree.find((c) => c.id === parentId);
    if (parent?.children?.length) {
      onChange({ categoryId: undefined });
    } else {
      onChange({ categoryId: parentId });
    }
  }

  function autoGenerateTitle() {
    const parts: string[] = [];
    if (data.categoryId) {
      const cat = categoryTree
        .flatMap((c) => [c, ...(c.children ?? [])])
        .find((c) => c.id === data.categoryId);
      if (cat) parts.push(cat.name);
    }
    if (data.partSide && data.partSide !== 'Nie dotyczy') parts.push(data.partSide.toLowerCase());
    if (data.condition === 'USED') parts.push('używana');
    if (data.condition === 'DAMAGED') parts.push('uszkodzona');
    onChange({ title: parts.join(' ') });
  }

  return (
    <div className="space-y-6">
      {/* Kategoria */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Kategoria części</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Kategoria główna</Label>
            <select
              value={selectedParent?.id ?? ''}
              onChange={(e) => handleParentChange(e.target.value)}
              className={cn(
                'w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                missingCategory ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300',
              )}
            >
              <option value="">Wybierz kategorię</option>
              {categoryTree.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {children.length > 0 && (
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Podkategoria</Label>
              <select
                value={data.categoryId ?? ''}
                onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
                className={cn(
                  'w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  missingCategory ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300',
                )}
              >
                <option value="">Wybierz podkategorię</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {missingCategory && (
          <p className="mt-2 text-sm text-red-600">Wybierz kategorię, aby przejść dalej.</p>
        )}
      </div>

      {/* Strona montażu */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Strona montażu</Label>
        <div className="flex gap-2">
          {PART_SIDES.map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => onChange({ partSide: side })}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                data.partSide === side
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </div>

      {/* Stan */}
      <div>
        <Label className="text-base font-semibold mb-2 block">Stan</Label>
        <div className="grid grid-cols-3 gap-3">
          {CONDITIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ condition: value })}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                data.condition === value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
            >
              <p className={cn('text-sm font-semibold', data.condition === value ? 'text-primary-700' : 'text-gray-900')}>
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {data.condition === 'DAMAGED' && (
        <div>
          <Label htmlFor="damage">Opis uszkodzeń</Label>
          <textarea
            id="damage"
            rows={3}
            placeholder="Opisz szczegółowo uszkodzenia..."
            value={data.damageDescription ?? ''}
            onChange={(e) => onChange({ damageDescription: e.target.value || undefined })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Tytuł */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="title">Tytuł ogłoszenia</Label>
          <button
            type="button"
            onClick={autoGenerateTitle}
            className="text-xs text-primary-600 hover:underline"
          >
            Generuj automatycznie
          </button>
        </div>
        <Input
          id="title"
          placeholder="np. Lampa tylna Suzuki Samurai 1990 prawa"
          value={data.title ?? ''}
          onChange={(e) => onChange({ title: e.target.value || undefined })}
          maxLength={200}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{(data.title ?? '').length}/200</p>
      </div>

      {/* Opis */}
      <div>
        <Label htmlFor="description">Opis (min. {MIN_DESCRIPTION_LENGTH} znaków)</Label>
        <textarea
          id="description"
          rows={5}
          placeholder="Opisz część, jej stan, pasujące pojazdy..."
          value={data.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className={cn('text-xs mt-1 text-right', (data.description?.length ?? 0) < MIN_DESCRIPTION_LENGTH ? 'text-red-400' : 'text-gray-400')}>
          {data.description?.length ?? 0} znaków
        </p>
      </div>

      {/* Szczegóły dodatkowe */}
      <div>
        <Label htmlFor="partDetails">Dodatkowe informacje (opcjonalne)</Label>
        <Input
          id="partDetails"
          placeholder="np. z wiązką, bez osprzętu"
          value={data.partDetails ?? ''}
          onChange={(e) => onChange({ partDetails: e.target.value || undefined })}
          className="mt-1"
        />
      </div>
    </div>
  );
}
