import apiClient from './client';
import { Platform, PlatformStatus, UserPlatform } from '@/types';

export async function getPlatforms(): Promise<UserPlatform[]> {
  const { data } = await apiClient.get<UserPlatform[]>('/platforms');
  return data;
}

export async function connectPlatform(platform: Platform): Promise<UserPlatform> {
  const { data } = await apiClient.post<UserPlatform>(`/platforms/${platform}/connect`);
  return data;
}

export async function getAllegroOAuthStart(): Promise<{ authorizationUrl: string }> {
  const { data } = await apiClient.get<{ authorizationUrl: string }>('/platforms/allegro/oauth/start');
  return data;
}

export async function testPlatform(platform: Platform): Promise<{ ok: boolean; message: string }> {
  const { data } = await apiClient.get<{ ok: boolean; message: string }>(`/platforms/${platform}/test`);
  return data;
}

export async function disconnectPlatform(platform: Platform): Promise<void> {
  await apiClient.delete(`/platforms/${platform}`);
}

export async function publishListing(listingId: string, platforms: Platform[]): Promise<{ jobCount: number }> {
  const { data } = await apiClient.post<{ jobCount: number }>(`/listings/${listingId}/publish`, { platforms });
  return data;
}

export async function getPublishStatus(listingId: string): Promise<Record<Platform, PlatformStatus>> {
  const { data } = await apiClient.get<Record<Platform, PlatformStatus>>(`/listings/${listingId}/publish-status`);
  return data;
}

export interface AllegroNamedResource {
  id: string;
  name: string;
}

export interface AllegroSaleSettings {
  shippingRates: AllegroNamedResource[];
  returnPolicies: AllegroNamedResource[];
  impliedWarranties: AllegroNamedResource[];
  responsibleProducers: AllegroNamedResource[];
}

export async function getAllegroSaleSettings(): Promise<AllegroSaleSettings> {
  const { data } = await apiClient.get<AllegroSaleSettings>('/platforms/allegro/sale-settings');
  return data;
}

export async function searchAllegroBrands(params: {
  categoryId: string;
  title?: string;
  q?: string;
}): Promise<AllegroNamedResource[]> {
  const { data } = await apiClient.get<{ brands: AllegroNamedResource[] }>('/platforms/allegro/brands', {
    params,
  });
  return data.brands;
}

export async function searchAllegroCategories(q: string): Promise<AllegroNamedResource[]> {
  const { data } = await apiClient.get<{ categories: AllegroNamedResource[] }>(
    '/platforms/allegro/categories/search',
    { params: { q } },
  );
  return data.categories;
}
