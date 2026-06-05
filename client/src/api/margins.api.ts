import apiClient from './client';
import { MarginRule } from '@/types';

export async function getMarginRules(): Promise<MarginRule[]> {
  const { data } = await apiClient.get<MarginRule[]>('/settings/margins');
  return data;
}

export async function saveMarginRules(rules: Omit<MarginRule, 'id'>[]): Promise<MarginRule[]> {
  const { data } = await apiClient.put<MarginRule[]>('/settings/margins', rules);
  return data;
}
