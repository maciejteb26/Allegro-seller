import apiClient from './client';

export interface ParsedListingData {
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  partCategory: string | null;
  partSubcategory: string | null;
  partSide: 'Lewa' | 'Prawa' | null;
  condition: 'NEW' | 'USED' | 'DAMAGED' | null;
  catalogNumber: string | null;
  confidence: number;
  needsReview: boolean;
  parserMode: 'AI' | 'REGEX';
}

export async function parseListingInput(input: string): Promise<ParsedListingData> {
  const { data } = await apiClient.post<ParsedListingData>('/listings/parse-input', { input });
  return data;
}
