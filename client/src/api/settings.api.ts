import apiClient from './client';

export interface AiSettings {
  configured: boolean;
  mode: 'AI' | 'MOCK' | 'OFF';
  model: string;
  features: string[];
}

export async function getAiSettings(): Promise<AiSettings> {
  const { data } = await apiClient.get<AiSettings>('/settings/ai');
  return data;
}

export interface SearchSettings {
  mode: 'MOCK' | 'SERPAPI' | 'GOOGLE_CSE';
  mock: boolean;
  sellerCount: number;
  sellers: string[];
}

export async function getSearchSettings(): Promise<SearchSettings> {
  const { data } = await apiClient.get<SearchSettings>('/settings/search');
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/settings/password', { currentPassword, newPassword });
}
