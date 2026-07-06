import apiClient from './client';

export type ClientVatRate = '23' | '8' | '5' | '0' | 'zw';
export type ClientImportProfile = 'auto' | 'zestawienie' | 'lista_produktow';

export interface Client {
  id: string;
  name: string;
  slug: string;
  vatRate: ClientVatRate;
  issuesInvoices: boolean;
  importProfile: ClientImportProfile;
  seoPrompt: string | null;
  sellerDomains: string[];
  notes: string | null;
  allegroReturnPolicyName: string | null;
  allegroImpliedWarrantyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  vatRate?: ClientVatRate;
  issuesInvoices?: boolean;
  importProfile?: ClientImportProfile;
  seoPrompt?: string | null;
  sellerDomains?: string[];
  notes?: string | null;
  allegroReturnPolicyName?: string | null;
  allegroImpliedWarrantyName?: string | null;
}

export const SEO_PROMPT_MAX_LENGTH = 2000;

export const SELLER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ebay.com', label: 'eBay' },
  { value: 'ebay.de', label: 'eBay DE' },
  { value: 'ebay.pl', label: 'eBay PL' },
  { value: 'amazon.de', label: 'Amazon DE' },
  { value: 'amazon.com', label: 'Amazon' },
  { value: 'amazon.co.uk', label: 'Amazon UK' },
  { value: 'autodoc.de', label: 'Autodoc' },
  { value: 'autodoc.pl', label: 'Autodoc PL' },
  { value: 'allegro.pl', label: 'Allegro' },
  { value: 'motointegrator.pl', label: 'MotoIntegrator' },
  { value: 'moto-faza.pl', label: 'Moto-Faza' },
  { value: 'oponeo.pl', label: 'Oponeo' },
  { value: 'ceneo.pl', label: 'Ceneo' },
  { value: 'partslink24.com', label: 'Partslink24' },
  { value: 'car-part.com', label: 'Car-Part' },
  { value: 'rockauto.com', label: 'RockAuto' },
];

export interface ClientsListResponse {
  clients: Client[];
  activeClientId: string | null;
}

export const VAT_OPTIONS: { value: ClientVatRate; label: string }[] = [
  { value: '23', label: '23%' },
  { value: '8', label: '8%' },
  { value: '5', label: '5%' },
  { value: '0', label: '0%' },
  { value: 'zw', label: 'Zwolniony' },
];

export const IMPORT_PROFILE_OPTIONS: { value: ClientImportProfile; label: string }[] = [
  { value: 'auto', label: 'Auto-wykrywanie' },
  { value: 'zestawienie', label: 'Zestawienie' },
  { value: 'lista_produktow', label: 'Lista produktów' },
];

export async function getClients(): Promise<ClientsListResponse> {
  const { data } = await apiClient.get<ClientsListResponse>('/clients');
  return data;
}

export async function getActiveClient(): Promise<{ client: Client | null }> {
  const { data } = await apiClient.get<{ client: Client | null }>('/clients/active');
  return data;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data } = await apiClient.post<Client>('/clients', input);
  return data;
}

export async function updateClient(id: string, input: ClientInput): Promise<Client> {
  const { data } = await apiClient.put<Client>(`/clients/${id}`, input);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}

export async function setActiveClient(id: string): Promise<Client> {
  const { data } = await apiClient.put<Client>(`/clients/active/${id}`);
  return data;
}
