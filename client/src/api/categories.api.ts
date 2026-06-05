import apiClient from './client';
import { InternalCategory, VehicleMake, VehicleModel, VehicleGeneration, VehicleType } from '../types';

export async function getCategories(): Promise<InternalCategory[]> {
  const { data } = await apiClient.get<InternalCategory[]>('/categories');
  return data;
}

export interface CategoryMappingExport {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  parentSlug: string | null;
  mappings: Record<
    string,
    { externalCategoryId: string; externalCategoryName: string | null } | null
  >;
}

export async function getCategoryMappings(): Promise<CategoryMappingExport[]> {
  const { data } = await apiClient.get<CategoryMappingExport[]>('/categories/mappings');
  return data;
}

export async function getVehicleMakes(type?: VehicleType): Promise<VehicleMake[]> {
  const { data } = await apiClient.get<VehicleMake[]>('/vehicles/makes', {
    params: type ? { type } : {},
  });
  return data;
}

export async function getVehicleModels(makeId: string): Promise<VehicleModel[]> {
  const { data } = await apiClient.get<VehicleModel[]>(`/vehicles/makes/${makeId}/models`);
  return data;
}

export async function getVehicleGenerations(modelId: string): Promise<VehicleGeneration[]> {
  const { data } = await apiClient.get<VehicleGeneration[]>(`/vehicles/models/${modelId}/generations`);
  return data;
}
