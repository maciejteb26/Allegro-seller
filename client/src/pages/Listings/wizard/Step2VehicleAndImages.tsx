import { ListingImage } from '@/types';
import { Step1Vehicle } from './Step1Vehicle';
import { Step3Images } from './Step3Images';
import { WizardData } from './types';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  showImageError?: boolean;
  existingImages?: ListingImage[];
  onRemoveExisting?: (imageId: string) => void;
}

export function Step2VehicleAndImages({
  data,
  onChange,
  showImageError,
  existingImages,
  onRemoveExisting,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Dopasowanie pojazdu</h3>
          <p className="mt-1 text-sm text-gray-500">
            Opcjonalne — ułatwia znalezienie części przez kupujących.
          </p>
        </div>
        <Step1Vehicle data={data} onChange={onChange} compact />
      </section>

      <hr className="border-gray-200" />

      <Step3Images
        data={data}
        onChange={onChange}
        showImageError={showImageError}
        existingImages={existingImages}
        onRemoveExisting={onRemoveExisting}
      />
    </div>
  );
}
