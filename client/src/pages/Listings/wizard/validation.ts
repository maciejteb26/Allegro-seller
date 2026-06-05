import { MIN_DESCRIPTION_LENGTH, MIN_IMAGES } from './constants';
import { WizardData } from './types';

export function hasMinImages(data: WizardData, existingImageCount = 0): boolean {
  return data.images.length + existingImageCount >= MIN_IMAGES;
}

export function canProceed(step: number, data: WizardData, existingImageCount = 0): boolean {
  return getStepValidationErrors(step, data, existingImageCount).length === 0;
}

export function getStepValidationErrors(
  step: number,
  data: WizardData,
  existingImageCount = 0,
): string[] {
  const errors: string[] = [];

  if (step === 0) {
    if (!data.categoryId) errors.push('Wybierz kategorię części');
    if (!data.condition) errors.push('Wybierz stan części');
    if (!data.title?.trim()) errors.push('Podaj tytuł ogłoszenia');
    if ((data.description?.trim().length ?? 0) < MIN_DESCRIPTION_LENGTH) {
      errors.push(`Opis musi mieć co najmniej ${MIN_DESCRIPTION_LENGTH} znaków`);
    }
  }

  if (step === 1 && !hasMinImages(data, existingImageCount)) {
    errors.push('Dodaj co najmniej jedno zdjęcie');
  }

  if (step === 2) {
    if (!data.basePrice || data.basePrice <= 0) errors.push('Podaj cenę bazową');
    if (!hasMinImages(data, existingImageCount)) errors.push('Dodaj co najmniej jedno zdjęcie');
  }

  return errors;
}
