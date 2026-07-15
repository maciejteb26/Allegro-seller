import apiClient from './client';
import { Listing, ListingStatus } from '../types';

export interface CreateListingData {
  title: string;
  description: string;
  productBrand?: string;
  basePrice: number;
  condition: 'NEW' | 'USED' | 'DAMAGED';
  quantity?: number;
  identMethod: 'VIN' | 'CATALOG_NUMBER' | 'MANUAL' | 'AI_PARSED';
  vin?: string;
  catalogNumber?: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'OTHER';
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleGenId?: string;
  vehicleYearRaw?: number;
  vehicleEngine?: string;
  categoryId: string;
  partSide?: string;
  partDetails?: string;
  damageDescription?: string;
  rawUserInput?: string;
  allegroShippingRateId?: string;
  allegroReturnPolicyId?: string;
  allegroImpliedWarrantyId?: string;
  allegroResponsibleProducerId?: string;
  allegroCategoryId?: string;
  allegroCategoryName?: string;
}

export interface ListingsResponse {
  items: Listing[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export async function createListing(data: CreateListingData): Promise<Listing> {
  const { data: res } = await apiClient.post<Listing>('/listings', data);
  return res;
}

export async function getListings(params?: {
  status?: ListingStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ListingsResponse> {
  const { data } = await apiClient.get<ListingsResponse>('/listings', { params });
  return data;
}

export async function getListing(id: string): Promise<Listing> {
  const { data } = await apiClient.get<Listing>(`/listings/${id}`);
  return data;
}

export async function updateListing(id: string, data: Partial<CreateListingData>): Promise<Listing> {
  const { data: res } = await apiClient.put<Listing>(`/listings/${id}`, data);
  return res;
}

export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

export interface BulkAllegroSettings {
  allegroShippingRateId?: string | null;
  allegroReturnPolicyId?: string | null;
  allegroImpliedWarrantyId?: string | null;
  allegroResponsibleProducerId?: string | null;
}

export async function bulkUpdateAllegroSettings(ids: string[], settings: BulkAllegroSettings): Promise<{ updated: number }> {
  const { data } = await apiClient.patch<{ updated: number }>('/listings/bulk/allegro-settings', {
    ids,
    ...settings,
  });
  return data;
}

export async function duplicateListing(id: string): Promise<Listing> {
  const { data } = await apiClient.post<Listing>(`/listings/${id}/duplicate`);
  return data;
}

export async function publishListing(
  id: string,
  platforms: Array<'ALLEGRO'> = ['ALLEGRO'],
): Promise<{ results: Record<string, string> }> {
  const { data } = await apiClient.post<{ results: Record<string, string> }>(`/listings/${id}/publish`, {
    platforms,
  });
  return data;
}

export async function uploadImages(listingId: string, files: File[]): Promise<void> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  await apiClient.post(`/listings/${listingId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function deleteImage(listingId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/listings/${listingId}/images/${imageId}`);
}
