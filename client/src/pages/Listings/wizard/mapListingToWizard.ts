import { Listing } from '@/types';
import { WizardData } from './types';

function orUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function mapListingToWizard(listing: Listing): WizardData {
  return {
    identMethod: listing.identMethod,
    vin: orUndefined(listing.vin),
    catalogNumber: orUndefined(listing.catalogNumber),
    vehicleType: listing.vehicleType,
    vehicleMakeId: orUndefined(listing.vehicleMakeId),
    vehicleModelId: orUndefined(listing.vehicleModelId),
    vehicleGenId: orUndefined(listing.vehicleGenId),
    vehicleYearRaw: orUndefined(listing.vehicleYearRaw),
    vehicleEngine: orUndefined(listing.vehicleEngine),
    categoryId: listing.categoryId,
    partSide: orUndefined(listing.partSide),
    condition: listing.condition,
    title: listing.title,
    description: listing.description,
    partDetails: orUndefined(listing.partDetails),
    damageDescription: orUndefined(listing.damageDescription),
    basePrice: Number(listing.basePrice),
    quantity: listing.quantity,
    selectedPlatforms: listing.platformListings.map((item) => item.platform),
    images: [],
  };
}
