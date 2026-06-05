import apiClient from './client';
import { Listing, Platform } from '@/types';

export interface DashboardStats {
  totalListings: number;
  activeListings: number;
  draftListings: number;
  listingsByPlatform: { platform: Platform; active: number }[];
  recentListings: Listing[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
  return data;
}
