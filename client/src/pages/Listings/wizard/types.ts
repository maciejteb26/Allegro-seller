import { Condition, IdentMethod, Platform, VehicleType } from '@/types';

export interface WizardData {
  // Step 1
  identMethod: IdentMethod;
  vin?: string;
  catalogNumber?: string;
  vehicleType: VehicleType;
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleGenId?: string;
  vehicleYearRaw?: number;
  vehicleEngine?: string;

  // Step 2
  categoryId?: string;
  partSide?: string;
  condition?: Condition;
  title?: string;
  description?: string;
  partDetails?: string;
  damageDescription?: string;

  // Step 3
  images: File[];

  // Step 4
  basePrice?: number;
  quantity?: number;
  selectedPlatforms: Platform[];
}

export const WIZARD_DEFAULTS: WizardData = {
  identMethod: 'MANUAL',
  vehicleType: 'CAR',
  images: [],
  selectedPlatforms: [],
};
