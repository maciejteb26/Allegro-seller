import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { createListing, uploadImages } from '@/api/listings.api';
import { publishListing } from '@/api/platforms.api';
import { getCategories } from '@/api/categories.api';
import { Step2Details } from './wizard/Step2Details';
import { Step2VehicleAndImages } from './wizard/Step2VehicleAndImages';
import { Step4Submit } from './wizard/Step4Submit';
import { WizardData, WIZARD_DEFAULTS } from './wizard/types';
import { WIZARD_STEPS } from './wizard/constants';
import { canProceed, getStepValidationErrors, hasMinImages } from './wizard/validation';
import { AIParser } from '@/components/shared/AIParser';
import { useWizardDraft } from './wizard/useWizardDraft';
import { DraftRestoreBanner } from './wizard/DraftRestoreBanner';
import { WizardDraftSkeleton } from './wizard/WizardDraftSkeleton';

export default function NewListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(WIZARD_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const handleRestore = useCallback((restoredStep: number, restoredData: WizardData) => {
    setStep(restoredStep);
    setData(restoredData);
    setStepError(false);
  }, []);

  const { isHydrating, restoredDraft, dismissDraft, clearDraft } = useWizardDraft({
    step,
    data,
    onRestore: handleRestore,
  });

  function patch(update: Partial<WizardData>) {
    setData((prev) => {
      const next = { ...prev, ...update };
      if (stepError && canProceed(step, next)) setStepError(false);
      return next;
    });
  }

  function handleAiApply(aiPatch: Partial<WizardData>) {
    patch(aiPatch);
    toast('Formularz uzupełniony na podstawie opisu', 'success');
  }

  function goNext() {
    const errors = getStepValidationErrors(step, data);
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
    if (!canProceed(2, data)) {
      setStepError(true);
      if (!hasMinImages(data)) setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const listing = await createListing({
        title: data.title!,
        description: data.description!,
        productBrand: data.productBrand,
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
        allegroShippingRateId: data.allegroShippingRateId,
        allegroReturnPolicyId: data.allegroReturnPolicyId,
        allegroImpliedWarrantyId: data.allegroImpliedWarrantyId,
        allegroResponsibleProducerId: data.allegroResponsibleProducerId,
        allegroCategoryId: data.allegroCategoryId,
        allegroCategoryName: data.allegroCategoryName,
      });

      await uploadImages(listing.id, data.images);

      if (data.selectedPlatforms.length > 0) {
        await publishListing(listing.id, data.selectedPlatforms);
      }

      clearDraft();
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Ogłoszenie zostało zapisane!', 'success');
      navigate('/listings');
    } catch {
      toast('Błąd podczas zapisywania ogłoszenia', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const proceed = canProceed(step, data);
  const showImageError = step === 1 && stepError && !hasMinImages(data);

  if (isHydrating) {
    return <WizardDraftSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nowe ogłoszenie</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wypełnij dane w {WIZARD_STEPS.length} krokach — szkic zapisuje się automatycznie
        </p>
      </div>

      {restoredDraft && (
        <DraftRestoreBanner draft={restoredDraft} onDismiss={dismissDraft} />
      )}

      <AIParser categories={categories} vehicleType={data.vehicleType} onApply={handleAiApply} />

      <div className="flex items-center gap-0">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => {
                if (i < step) {
                  setStepError(false);
                  setStep(i);
                }
              }}
              className="flex flex-col items-center gap-1 flex-1"
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
                  'text-xs font-medium hidden sm:block',
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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{WIZARD_STEPS[step].label}</h2>
        <p className="text-sm text-gray-500 mb-6">{WIZARD_STEPS[step].desc}</p>

        {step === 0 && (
          <Step2Details data={data} onChange={patch} showValidation={stepError} />
        )}
        {step === 1 && (
          <Step2VehicleAndImages data={data} onChange={patch} showImageError={showImageError} />
        )}
        {step === 2 && <Step4Submit data={data} onChange={patch} />}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Anuluj' : 'Wstecz'}
        </Button>

        {step < WIZARD_STEPS.length - 1 ? (
          <Button onClick={goNext}>
            Dalej
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!proceed || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {submitting ? 'Zapisywanie...' : 'Zapisz ogłoszenie'}
          </Button>
        )}
      </div>
    </div>
  );
}
