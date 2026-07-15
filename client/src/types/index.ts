export type Plan = 'FREE' | 'PRO' | 'BUSINESS';
export type Platform = 'ALLEGRO';
export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'OTHER';
export type Condition = 'NEW' | 'USED' | 'DAMAGED';
export type IdentMethod = 'VIN' | 'CATALOG_NUMBER' | 'MANUAL' | 'AI_PARSED';
export type ListingStatus = 'DRAFT' | 'PUBLISHING' | 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'ENDED' | 'ERROR';
export type PlatformStatus = 'PENDING' | 'ACTIVE' | 'ENDED' | 'ERROR';
export type MarginType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  createdAt: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  types: VehicleType[];
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  generations?: VehicleGeneration[];
}

export interface VehicleGeneration {
  id: string;
  modelId: string;
  name: string | null;
  yearFrom: number;
  yearTo: number | null;
}

export interface InternalCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: InternalCategory[];
}

export interface ListingImage {
  id: string;
  s3Key: string;
  order: number;
  isMain: boolean;
  url?: string;
}

export interface PlatformListing {
  platform: Platform;
  status: PlatformStatus;
  finalPrice: number;
  platformTitle: string;
  externalId?: string;
  externalUrl?: string;
  errorMessage?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  condition: Condition;
  quantity: number;
  identMethod: IdentMethod;
  vin?: string;
  catalogNumber?: string;
  vehicleType: VehicleType;
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleGenId?: string;
  vehicleYearRaw?: number;
  vehicleEngine?: string;
  categoryId: string;
  partSide?: string;
  partDetails?: string;
  damageDescription?: string;
  allegroShippingRateId?: string;
  allegroReturnPolicyId?: string;
  allegroImpliedWarrantyId?: string;
  allegroResponsibleProducerId?: string;
  allegroCategoryId?: string;
  allegroCategoryName?: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  platformListings: PlatformListing[];
}

export interface MarginRule {
  id: string;
  platform: Platform;
  marginType: MarginType;
  marginValue: number;
}

export interface UserPlatform {
  platform: Platform;
  isActive: boolean;
  connectedAt: string;
  tokenExpiry?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
