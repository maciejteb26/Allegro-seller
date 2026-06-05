import {
  WIZARD_DRAFT_KEY,
  WIZARD_DRAFT_MAX_AGE_MS,
  WIZARD_DRAFT_VERSION,
} from './constants';
import { WizardData, WIZARD_DEFAULTS } from './types';

interface StoredImage {
  name: string;
  type: string;
  dataUrl: string;
}

interface WizardDraftStored {
  version: number;
  step: number;
  savedAt: string;
  imagesOmitted?: boolean;
  data: Omit<WizardData, 'images'>;
  images: StoredImage[];
}

export interface WizardDraftMeta {
  step: number;
  savedAt: Date;
  imagesOmitted: boolean;
  title?: string;
  basePrice?: number;
  condition?: string;
}

export const WIZARD_DRAFT_CHANGED_EVENT = 'wizard-draft-changed';

function notifyDraftChanged(): void {
  window.dispatchEvent(new Event(WIZARD_DRAFT_CHANGED_EVENT));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(stored: StoredImage): Promise<File> {
  const response = await fetch(stored.dataUrl);
  const blob = await response.blob();
  return new File([blob], stored.name, { type: stored.type });
}

export function mergeWizardData(stored: Omit<WizardData, 'images'>, images: File[]): WizardData {
  return {
    ...WIZARD_DEFAULTS,
    ...stored,
    images,
    selectedPlatforms: stored.selectedPlatforms ?? [],
    quantity: stored.quantity ?? 1,
  };
}

export function hasDraftContent(data: WizardData, step: number): boolean {
  return (
    step > 0 ||
    !!data.categoryId ||
    !!data.title?.trim() ||
    !!data.description?.trim() ||
    !!data.condition ||
    !!data.partSide ||
    !!data.vehicleMakeId ||
    !!data.vehicleModelId ||
    !!data.basePrice ||
    data.images.length > 0
  );
}

export function loadDraftMeta(): WizardDraftMeta | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WizardDraftStored;
    if (parsed.version !== WIZARD_DRAFT_VERSION) {
      localStorage.removeItem(WIZARD_DRAFT_KEY);
      return null;
    }

    const savedAt = new Date(parsed.savedAt);
    if (Number.isNaN(savedAt.getTime()) || Date.now() - savedAt.getTime() > WIZARD_DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(WIZARD_DRAFT_KEY);
      return null;
    }

    return {
      step: parsed.step,
      savedAt,
      imagesOmitted: !!parsed.imagesOmitted,
      title: parsed.data.title,
      basePrice: parsed.data.basePrice,
      condition: parsed.data.condition,
    };
  } catch {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
    return null;
  }
}

export async function loadDraft(): Promise<{ step: number; data: WizardData } | null> {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as WizardDraftStored;
    if (parsed.version !== WIZARD_DRAFT_VERSION) return null;

    const savedAt = new Date(parsed.savedAt);
    if (Number.isNaN(savedAt.getTime()) || Date.now() - savedAt.getTime() > WIZARD_DRAFT_MAX_AGE_MS) {
      clearWizardDraft();
      return null;
    }

    const images = parsed.imagesOmitted
      ? []
      : await Promise.all(parsed.images.map(dataUrlToFile));

    return {
      step: parsed.step,
      data: mergeWizardData(parsed.data, images),
    };
  } catch {
    clearWizardDraft();
    return null;
  }
}

export async function saveWizardDraft(step: number, data: WizardData): Promise<void> {
  if (!hasDraftContent(data, step)) {
    if (localStorage.getItem(WIZARD_DRAFT_KEY)) clearWizardDraft();
    return;
  }

  const payload: WizardDraftStored = {
    version: WIZARD_DRAFT_VERSION,
    step,
    savedAt: new Date().toISOString(),
    data: {
      identMethod: data.identMethod,
      vin: data.vin,
      catalogNumber: data.catalogNumber,
      vehicleType: data.vehicleType,
      vehicleMakeId: data.vehicleMakeId,
      vehicleModelId: data.vehicleModelId,
      vehicleGenId: data.vehicleGenId,
      vehicleYearRaw: data.vehicleYearRaw,
      vehicleEngine: data.vehicleEngine,
      categoryId: data.categoryId,
      partSide: data.partSide,
      condition: data.condition,
      title: data.title,
      description: data.description,
      partDetails: data.partDetails,
      damageDescription: data.damageDescription,
      basePrice: data.basePrice,
      quantity: data.quantity,
      selectedPlatforms: data.selectedPlatforms,
    },
    images: [],
  };

  try {
    payload.images = await Promise.all(
      data.images.map(async (file) => ({
        name: file.name,
        type: file.type,
        dataUrl: await fileToDataUrl(file),
      })),
    );
    localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(payload));
    notifyDraftChanged();
  } catch {
    try {
      payload.images = [];
      payload.imagesOmitted = true;
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(payload));
      notifyDraftChanged();
    } catch {
      // localStorage pełny
    }
  }
}

export function clearWizardDraft(): void {
  localStorage.removeItem(WIZARD_DRAFT_KEY);
  notifyDraftChanged();
}
