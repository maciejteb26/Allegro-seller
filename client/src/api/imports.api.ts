import apiClient from './client';

export type IdentifierType = 'GTIN' | 'MPN' | 'PHRASE';
export type ImportEnrichStatus = 'pending' | 'matched' | 'not_found' | 'skipped' | 'error';
export type ImportSeoStatus = 'pending' | 'generated' | 'skipped' | 'error';
export type ImportCondition = 'NEW' | 'USED' | 'DAMAGED';

export interface ParsedImportRow {
  rowIndex: number;
  sourceLink: string;
  identifierRaw: string;
  identifierType: IdentifierType;
  searchPhrase: string;
  signature: string;
  condition: ImportCondition | null;
  quantity: number;
  packaging: string;
  price: number | null;
  delivery: string;
  draftTitle: string;
  notes: string;
}

export interface AllegroCatalogProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  gtin?: string;
}

export interface ImportSeoContent {
  title: string;
  description: string;
  titleLength: number;
  mode: 'AI' | 'RULES';
}

export interface ExternalProductHit {
  title: string;
  url: string;
  snippet: string;
  source: string;
  sellerName?: string;
  language?: string;
}

export interface ExternalProductData {
  title: string;
  description: string;
  language?: string;
  sourceUrl: string;
  sourceName: string;
  imageUrls: string[];
  hits: ExternalProductHit[];
}

export interface EnrichedImportRow extends ParsedImportRow {
  enrichStatus: ImportEnrichStatus;
  enrichMessage?: string;
  allegroProduct: AllegroCatalogProduct | null;
  externalProduct: ExternalProductData | null;
}

export type ImportPublishStatus = 'published' | 'skipped' | 'error';

export interface SeoImportRow extends EnrichedImportRow {
  seo?: ImportSeoContent | null;
  seoStatus?: ImportSeoStatus;
  seoMessage?: string;
  publishStatus?: ImportPublishStatus;
  publishMessage?: string;
  listingId?: string;
  externalUrl?: string;
}

export interface ClientContext {
  clientId: string;
  clientName: string;
  vatRate: string;
  issuesInvoices: boolean;
  importProfile: string;
  seoPrompt: string | null;
  sellerDomains: string[];
}

export interface ParseImportResponse {
  profile: string;
  profileLabel?: string;
  fileName: string;
  totalRows: number;
  rows: ParsedImportRow[];
  client?: ClientContext | null;
}

export interface EnrichImportResponse {
  rows: EnrichedImportRow[];
  summary: { matched: number; notFound: number; errors: number; total: number };
}

export interface GenerateSeoResponse {
  rows: SeoImportRow[];
  summary: { generated: number; skipped: number; errors: number; aiCount: number; total: number };
  client?: ClientContext | null;
}

export async function parseImportFile(file: File, clientId?: string): Promise<ParseImportResponse> {
  const form = new FormData();
  form.append('file', file);
  if (clientId) form.append('clientId', clientId);
  const { data } = await apiClient.post<ParseImportResponse>('/imports/parse', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function enrichImportRows(rows: ParsedImportRow[], clientId?: string): Promise<EnrichImportResponse> {
  const { data } = await apiClient.post<EnrichImportResponse>('/imports/enrich', { rows, clientId });
  return data;
}

export async function generateImportSeo(rows: EnrichedImportRow[], clientId?: string): Promise<GenerateSeoResponse> {
  const { data } = await apiClient.post<GenerateSeoResponse>('/imports/generate-seo', { rows, clientId });
  return data;
}

export interface PublishImportResponse {
  rows: SeoImportRow[];
  summary: { published: number; skipped: number; errors: number; total: number };
}

export async function publishImportRows(rows: SeoImportRow[]): Promise<PublishImportResponse> {
  const { data } = await apiClient.post<PublishImportResponse>('/imports/publish', { rows });
  return data;
}
