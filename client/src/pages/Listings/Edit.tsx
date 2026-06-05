import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  deleteImage,
  getListing,
  updateListing,
  uploadImages,
} from '@/api/listings.api';
import { publishListing } from '@/api/platforms.api';
import { ListingImage } from '@/types';
import { Step2Details } from './wizard/Step2Details';
import { Step2VehicleAndImages } from './wizard/Step2VehicleAndImages';
import { Step4Submit } from './wizard/Step4Submit';
import { WizardData, WIZARD_DEFAULTS } from './wizard/types';
import { WIZARD_STEPS } from './wizard/constants';
import { canProceed, getStepValidationErrors, hasMinImages } from './wizard/validation';
import { mapListingToWizard } from './wizard/mapListingToWizard';
import { WizardDraftSkeleton } from './wizard/WizardDraftSkeleton';

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(WIZARD_DEFAULTS);
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState(false);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!listing) return;
    setData(mapListingToWizard(listing));
    setExistingImages(listing.images);
  }, [listing]);

  const existingCount = existingImages.length;

  function patch(update: Partial<WizardData>) {
    setData((prev) => {
      const next = { ...prev, ...update };
      if (stepError && canProceed(step, next, existingCount)) setStepError(false);
      return next;
    });
  }

  async function handleRemoveExisting(imageId: string) {
    if (!id) return;
    try {
      await deleteImage(id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      toast('Nie udało się usunąć zdjęcia', 'error');
    }
  }

  function goNext() {
    const errors = getStepValidationErrors(step, data, existingCount);
    if (errors.length > 0) {
      setStepError(true);
      toast(errors[0], 'error');
      return;
    }
    setStepError(false);
    setStep((s) => s + 1);
  }

  function goBack() {
    setStepError(false);
    if (step === 0) navigate('/listings');
    else setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!id || !canProceed(2, data, existingCount)) {
      setStepError(true);
      if (!hasMinImages(data, existingCount)) setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      await updateListing(id, {
        title: data.title!,
        description: data.description!,
        basePrice: data.basePrice!,
        condition: data.condition!,
        quantity: data.quantity ?? 1,
        identMethod: data.identMethod,
        vin: data.vin,
        catalogNumber: data.catalogNumber,
        vehicleType: data.vehicleType,
        vehicleMakeId: data.vehicleMakeId,
        vehicleModelId: data.vehicleModelId,
        vehicleGenId: data.vehicleGenId,
        vehicleYearRaw: data.vehicleYearRaw,
        vehicleEngine: data.vehicleEngine,
        categoryId: data.categoryId!,
        partSide: data.partSide,
        partDetails: data.partDetails,
        damageDescription: data.damageDescription,
      });

      if (data.images.length > 0) {
        await uploadImages(id, data.images);
      }

      if (data.selectedPlatforms.length > 0) {
        try {
          await publishListing(id, data.selectedPlatforms);
        } catch (publishErr) {
          const publishMsg = isAxiosError(publishErr)
            ? (publishErr.response?.data as { error?: string })?.error
            : undefined;
          toast(
            publishMsg
              ? `Zapisano, ale publikacja nie powiodła się: ${publishMsg}`
              : 'Zapisano, ale publikacja na platformach nie powiodła się',
            'error',
          );
          navigate('/listings');
          return;
        }
      }

      toast('Ogłoszenie zostało zaktualizowane', 'success');
      navigate('/listings');
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error
        : undefined;
      toast(message ?? 'Błąd podczas zapisywania ogłoszenia', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <WizardDraftSkeleton />;
  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-gray-600">Nie znaleziono ogłoszenia.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/listings')}>
          Wróć do listy
        </Button>
      </div>
    );
  }

  const proceed = canProceed(step, data, existingCount);
  const showImageError = step === 1 && stepError && !hasMinImages(data, existingCount);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edytuj ogłoszenie</h1>
        <p className="mt-1 text-sm text-gray-500">
          {listing.status === 'DRAFT'
            ? 'Status „Szkic” — ogłoszenie jest zapisane, ale nieopublikowane na platformach. Wybierz platformy w ostatnim kroku i zapisz, aby wystawić.'
            : 'Zaktualizuj dane i zapisz zmiany.'}
        </p>
      </div>

      <div className="flex items-center gap-0">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => {
                if (i < step) {
                  setStepError(false);
                  setStep(i);
                }
              }}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  i < step && 'bg-primary-600 text-white',
                  i === step && 'bg-primary-600 text-white ring-4 ring-primary-100',
                  i > step && 'bg-gray-200 text-gray-500',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block',
                  i === step ? 'text-primary-700' : 'text-gray-500',
                )}
              >
                {s.label}
              </span>
            </button>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1', i < step ? 'bg-primary-600' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">{WIZARD_STEPS[step].label}</h2>
        <p className="mb-6 text-sm text-gray-500">{WIZARD_STEPS[step].desc}</p>

        {step === 0 && (
          <Step2Details data={data} onChange={patch} showValidation={stepError} />
        )}
        {step === 1 && (
          <Step2VehicleAndImages
            data={data}
            onChange={patch}
            showImageError={showImageError}
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExisting}
          />
        )}
        {step === 2 && (
          <Step4Submit data={data} onChange={patch} existingImageCount={existingCount} />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {step === 0 ? 'Anuluj' : 'Wstecz'}
        </Button>

        {step < WIZARD_STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Dalej
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!proceed || submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {submitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        )}
      </div>
    </div>
  );
}
