import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { getMarginRules, saveMarginRules } from '@/api/margins.api';
import { MarginRule } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

export default function MarginsSection() {
  const { data = [] } = useQuery({ queryKey: ['margins'], queryFn: getMarginRules });
  const [rule, setRule] = useState<Omit<MarginRule, 'id'>>({
    platform: 'ALLEGRO',
    marginType: 'PERCENTAGE',
    marginValue: 0,
  });
  const debounced = useDebounce(rule, 500);
  const { mutate: saveRules } = useMutation({ mutationFn: saveMarginRules });

  useEffect(() => {
    const allegroRule = data.find((item) => item.platform === 'ALLEGRO');
    if (allegroRule) {
      const { id: _id, ...rest } = allegroRule;
      setRule(rest);
    }
  }, [data]);

  useEffect(() => {
    saveRules([debounced]);
  }, [debounced, saveRules]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Marża Allegro</h2>
        <p className="text-sm text-gray-500 mt-1">Ustaw marżę dodawaną do ceny bazowej przy wystawianiu na Allegro</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm">
            AL
          </div>
          <span className="font-medium text-gray-900">Allegro</span>
        </div>

        <div className="flex gap-3">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={rule.marginType}
            onChange={(e) => setRule((r) => ({ ...r, marginType: e.target.value as MarginRule['marginType'] }))}
          >
            <option value="PERCENTAGE">Procent (%)</option>
            <option value="FIXED_AMOUNT">Kwota stała (PLN)</option>
          </select>
          <Input
            type="number"
            min={0}
            step={rule.marginType === 'PERCENTAGE' ? 0.1 : 0.01}
            value={rule.marginValue}
            onChange={(e) => setRule((r) => ({ ...r, marginValue: Number(e.target.value) }))}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
