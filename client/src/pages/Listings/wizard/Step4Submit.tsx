import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardData } from './types';
import { CONDITION_PART_LABELS } from './constants';
import { Platform } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getPlatforms, getAllegroSaleSettings } from '@/api/platforms.api';
import { getMarginRules } from '@/api/margins.api';
import { AllegroCategorySelect } from './AllegroCategorySelect';

const PLATFORMS: Platform[] = ['ALLEGRO'];

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  existingImageCount?: number;
}

export function Step4Submit({ data, onChange, existingImageCount = 0 }: Props) {
  const { data: platforms = [] } = useQuery({ queryKey: ['platforms'], queryFn: getPlatforms });
  const { data: margins = [] } = useQuery({ queryKey: ['margins'], queryFn: getMarginRules });

  const activePlatforms = new Set(platforms.filter((platform) => platform.isActive).map((platform) => platform.platform));

  const { data: saleSettings } = useQuery({
    queryKey: ['allegro-sale-settings'],
    queryFn: getAllegroSaleSettings,
    enabled: activePlatforms.has('ALLEGRO'),
  });
  const imageCount = existingImageCount + data.images.length;
  const conditionLabel = data.condition ? CONDITION_PART_LABELS[data.condition] ?? data.condition : '—';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Cena i ilość</h3>
        <p className="text-sm text-gray-500 mt-1">
          Podaj cenę bazową. Marże per platforma ustawisz w Ustawieniach (Etap 6).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Cena bazowa (PLN) *</Label>
          <div className="relative mt-1">
            <Input
              id="price"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="np. 150.00"
              value={data.basePrice ?? ''}
              onChange={(e) => onChange({ basePrice: e.target.value ? Number(e.target.value) : undefined })}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">PLN</span>
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">Ilość sztuk</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={data.quantity ?? 1}
            onChange={(e) => onChange({ quantity: e.target.value ? Number(e.target.value) : 1 })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Platformy publikacji</h4>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((platform) => {
            const active = activePlatforms.has(platform);
            const selected = data.selectedPlatforms.includes(platform);
            return (
              <label key={platform} className={`rounded border p-2 text-sm ${active ? 'cursor-pointer' : 'opacity-50'}`}>
                <input
                  type="checkbox"
                  className="mr-2"
                  disabled={!active}
                  checked={selected}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...data.selectedPlatforms, platform]
                      : data.selectedPlatforms.filter((item) => item !== platform);
                    onChange({ selectedPlatforms: next });
                  }}
                />
                {platform}
              </label>
            );
          })}
        </div>
      </div>

      {data.selectedPlatforms.includes('ALLEGRO') && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Ustawienia sprzedaży Allegro</h4>
          <p className="text-xs text-gray-500">
            Zostaw puste, aby system dopasował automatycznie (lub użył domyślnych ustawień klienta).
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="shippingRate">Dostawa</Label>
              <select
                id="shippingRate"
                value={data.allegroShippingRateId ?? ''}
                onChange={(e) => onChange({ allegroShippingRateId: e.target.value || undefined })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— automatycznie —</option>
                {saleSettings?.shippingRates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="returnPolicy">Zwroty</Label>
              <select
                id="returnPolicy"
                value={data.allegroReturnPolicyId ?? ''}
                onChange={(e) => onChange({ allegroReturnPolicyId: e.target.value || undefined })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— automatycznie —</option>
                {saleSettings?.returnPolicies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="impliedWarranty">Rękojmia</Label>
              <select
                id="impliedWarranty"
                value={data.allegroImpliedWarrantyId ?? ''}
                onChange={(e) => onChange({ allegroImpliedWarrantyId: e.target.value || undefined })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— automatycznie —</option>
                {saleSettings?.impliedWarranties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="responsibleProducer">Producent odpowiedzialny</Label>
              <select
                id="responsibleProducer"
                value={data.allegroResponsibleProducerId ?? ''}
                onChange={(e) => onChange({ allegroResponsibleProducerId: e.target.value || undefined })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— automatycznie —</option>
                {saleSettings?.responsibleProducers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AllegroCategorySelect
            categoryId={data.allegroCategoryId}
            categoryName={data.allegroCategoryName}
            onChange={(category) =>
              onChange({ allegroCategoryId: category?.id, allegroCategoryName: category?.name })
            }
          />
        </div>
      )}

      {/* Podsumowanie */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Podsumowanie ogłoszenia</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Tytuł</dt>
          <dd className="text-gray-900 truncate">{data.title ?? '—'}</dd>
          <dt className="text-gray-500">Stan</dt>
          <dd className="text-gray-900">{conditionLabel}</dd>
          <dt className="text-gray-500">Zdjęcia</dt>
          <dd className="text-gray-900">{imageCount}</dd>
          <dt className="text-gray-500">Ilość sztuk</dt>
          <dd className="text-gray-900">{data.quantity ?? 1} szt.</dd>
          <dt className="text-gray-500">Cena bazowa</dt>
          <dd className="text-gray-900 font-semibold">
            {data.basePrice ? `${data.basePrice.toFixed(2)} PLN` : '—'}
          </dd>
        </dl>
      </div>

      <p className="text-xs text-gray-400">
        Ogłoszenie zostanie zapisane w systemie.
        {data.selectedPlatforms.length > 0
          ? ' Zaznaczone platformy otrzymają ogłoszenie od razu po zapisie.'
          : ' Możesz opublikować je później w szczegółach ogłoszenia lub na zakładce Platformy.'}
      </p>

      {data.basePrice && data.selectedPlatforms.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Podglad cen koncowych</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {data.selectedPlatforms.map((platform) => {
              const basePrice = data.basePrice ?? 0;
              const rule = margins.find((item) => item.platform === platform);
              const finalPrice = !rule
                ? basePrice
                : rule.marginType === 'PERCENTAGE'
                  ? basePrice * (1 + rule.marginValue / 100)
                  : basePrice + rule.marginValue;
              return (
                <p key={platform}>
                  {platform}: {basePrice.toFixed(2)} PLN -&gt; {finalPrice.toFixed(2)} PLN
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
