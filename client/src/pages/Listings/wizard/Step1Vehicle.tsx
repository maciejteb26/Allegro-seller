import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Bike, Truck, HelpCircle, ChevronDown } from 'lucide-react';
import { getVehicleMakes, getVehicleModels, getVehicleGenerations } from '@/api/categories.api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WizardData } from './types';
import { VehicleType, IdentMethod } from '@/types';
import { VehicleMakeSelect } from './vehicle/VehicleMakeSelect';
import { VehicleModelSelect } from './vehicle/VehicleModelSelect';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  compact?: boolean;
}

const VEHICLE_TYPES: { value: VehicleType; label: string; Icon: React.ElementType }[] = [
  { value: 'CAR', label: 'Samochód', Icon: Car },
  { value: 'MOTORCYCLE', label: 'Motocykl', Icon: Bike },
  { value: 'TRUCK', label: 'Ciężarówka', Icon: Truck },
  { value: 'OTHER', label: 'Inne', Icon: HelpCircle },
];

const IDENT_METHODS: { value: IdentMethod; label: string }[] = [
  { value: 'VIN', label: 'Numer VIN' },
  { value: 'CATALOG_NUMBER', label: 'Numer katalogowy' },
  { value: 'MANUAL', label: 'Opis manualny' },
];

export function Step1Vehicle({ data, onChange, compact }: Props) {
  const prevType = useRef(data.vehicleType);
  const prevMake = useRef(data.vehicleMakeId);
  const prevModel = useRef(data.vehicleModelId);

  const { data: makes = [] } = useQuery({
    queryKey: ['makes', data.vehicleType],
    queryFn: () => getVehicleMakes(data.vehicleType),
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models', data.vehicleMakeId],
    queryFn: () => getVehicleModels(data.vehicleMakeId!),
    enabled: !!data.vehicleMakeId,
  });

  const { data: generations = [] } = useQuery({
    queryKey: ['generations', data.vehicleModelId],
    queryFn: () => getVehicleGenerations(data.vehicleModelId!),
    enabled: !!data.vehicleModelId,
  });

  useEffect(() => {
    if (prevType.current === data.vehicleType) return;
    const previous = prevType.current;
    prevType.current = data.vehicleType;
    if (previous !== undefined) {
      onChange({ vehicleMakeId: undefined, vehicleModelId: undefined, vehicleGenId: undefined });
    }
  }, [data.vehicleType, onChange]);

  useEffect(() => {
    if (prevMake.current === data.vehicleMakeId) return;
    const previous = prevMake.current;
    prevMake.current = data.vehicleMakeId;
    if (previous !== undefined) {
      onChange({ vehicleModelId: undefined, vehicleGenId: undefined });
    }
  }, [data.vehicleMakeId, onChange]);

  useEffect(() => {
    if (prevModel.current === data.vehicleModelId) return;
    prevModel.current = data.vehicleModelId;
    onChange({ vehicleGenId: undefined });
  }, [data.vehicleModelId, onChange]);

  const identSection = (
    <details className="rounded-lg border border-gray-200 bg-gray-50/50">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-700">
        Identyfikacja części (opcjonalnie)
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </summary>
      <div className="space-y-4 border-t border-gray-200 px-4 pb-4 pt-3">
        <div className="flex flex-wrap gap-2">
          {IDENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ identMethod: value })}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                data.identMethod === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {data.identMethod === 'VIN' && (
          <div>
            <Label htmlFor="vin">Numer VIN</Label>
            <Input
              id="vin"
              placeholder="np. WBA3A5G50DNP26082"
              value={data.vin ?? ''}
              onChange={(e) => onChange({ vin: e.target.value })}
              className="mt-1 uppercase"
              maxLength={17}
            />
          </div>
        )}
        {data.identMethod === 'CATALOG_NUMBER' && (
          <div>
            <Label htmlFor="catalog">Numer katalogowy OEM</Label>
            <Input
              id="catalog"
              placeholder="np. 63117188979"
              value={data.catalogNumber ?? ''}
              onChange={(e) => onChange({ catalogNumber: e.target.value })}
              className="mt-1"
            />
          </div>
        )}
      </div>
    </details>
  );

  return (
    <div className="space-y-5">
      {compact ? identSection : (
        <>
          <div>
            <Label className="mb-2 block text-base font-semibold">Metoda identyfikacji</Label>
            <div className="flex flex-wrap gap-2">
              {IDENT_METHODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ identMethod: value })}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    data.identMethod === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {data.identMethod === 'VIN' && (
            <div>
              <Label htmlFor="vin-full">Numer VIN</Label>
              <Input
                id="vin-full"
                placeholder="np. WBA3A5G50DNP26082"
                value={data.vin ?? ''}
                onChange={(e) => onChange({ vin: e.target.value })}
                className="mt-1 uppercase"
                maxLength={17}
              />
            </div>
          )}
          {data.identMethod === 'CATALOG_NUMBER' && (
            <div>
              <Label htmlFor="catalog-full">Numer katalogowy OEM</Label>
              <Input
                id="catalog-full"
                placeholder="np. 63117188979"
                value={data.catalogNumber ?? ''}
                onChange={(e) => onChange({ catalogNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          )}
        </>
      )}

      <div>
        <Label className={cn('mb-2 block font-semibold', compact ? 'text-sm' : 'text-base')}>
          Typ pojazdu
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {VEHICLE_TYPES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ vehicleType: value })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors sm:gap-2 sm:p-3',
                data.vehicleType === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs font-medium sm:text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <VehicleMakeSelect
        makes={makes}
        selectedId={data.vehicleMakeId}
        onSelect={(vehicleMakeId) => onChange({ vehicleMakeId })}
      />

      {data.vehicleMakeId && (
        <VehicleModelSelect
          models={models}
          selectedId={data.vehicleModelId}
          onSelect={(vehicleModelId) => onChange({ vehicleModelId })}
        />
      )}

      {data.vehicleModelId && (
        <div className="grid grid-cols-2 gap-4">
          {generations.length > 0 ? (
            <div>
              <Label className="mb-1 block text-sm">Generacja</Label>
              <select
                value={data.vehicleGenId ?? ''}
                onChange={(e) => onChange({ vehicleGenId: e.target.value || undefined })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wybierz generację</option>
                {generations.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name ? `${g.name} ` : ''}{g.yearFrom}–{g.yearTo ?? '...'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="year" className="mb-1 block text-sm">Rok produkcji</Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                placeholder="np. 1990"
                value={data.vehicleYearRaw ?? ''}
                onChange={(e) =>
                  onChange({ vehicleYearRaw: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
          )}
          <div>
            <Label htmlFor="engine" className="mb-1 block text-sm">Silnik (opcjonalnie)</Label>
            <Input
              id="engine"
              placeholder="np. 1.9 TDI"
              value={data.vehicleEngine ?? ''}
              onChange={(e) => onChange({ vehicleEngine: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
