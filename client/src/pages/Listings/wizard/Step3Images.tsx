import { X } from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { cn } from '@/lib/utils';
import { ListingImage } from '@/types';
import { MIN_IMAGES } from './constants';
import { WizardData } from './types';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  showImageError?: boolean;
  existingImages?: ListingImage[];
  onRemoveExisting?: (imageId: string) => void;
}

export function Step3Images({
  data,
  onChange,
  showImageError,
  existingImages = [],
  onRemoveExisting,
}: Props) {
  const totalCount = existingImages.length + data.images.length;
  const missingImages = totalCount < MIN_IMAGES;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Zdjęcia ogłoszenia *</h3>
        <p className="mt-1 text-sm text-gray-500">
          Wymagane min. {MIN_IMAGES} zdjęć łącznie (masz {totalCount}). Maks. 20.
        </p>
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {existingImages.map((image, index) => (
            <div key={image.id} className="relative aspect-square">
              <img
                src={image.url}
                alt={`Zdjęcie ${index + 1}`}
                className="h-full w-full rounded-lg border border-gray-200 object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary-600 px-1.5 py-0.5 text-xs text-white">
                  Główne
                </span>
              )}
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(image.id)}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-0.5 text-white"
                  title="Usuń zdjęcie"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ImageUploader
        files={data.images}
        onChange={(images) => onChange({ images })}
        maxFiles={Math.max(0, 20 - existingImages.length)}
      />

      {missingImages && (
        <p
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            showImageError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-700',
          )}
        >
          {showImageError
            ? 'Dodaj co najmniej jedno zdjęcie, aby przejść dalej.'
            : 'Ogłoszenie bez zdjęć sprzedaje się znacznie gorzej.'}
        </p>
      )}
    </div>
  );
}
