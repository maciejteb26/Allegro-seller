import { ExternalProductData } from './external-product.types';

export type IdentifierType = 'GTIN' | 'MPN' | 'PHRASE';

export type ImportEnrichStatus = 'pending' | 'matched' | 'not_found' | 'skipped' | 'error';

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

export interface EnrichedImportRow extends ParsedImportRow {
  enrichStatus: ImportEnrichStatus;
  enrichMessage?: string;
  allegroProduct: AllegroCatalogProduct | null;
  externalProduct: ExternalProductData | null;
}

export type ImportSeoStatus = 'pending' | 'generated' | 'skipped' | 'error';

export interface ImportSeoContent {
  title: string;
  description: string;
  titleLength: number;
  mode: 'AI' | 'RULES';
}

export interface SeoImportRow extends EnrichedImportRow {
  seo?: ImportSeoContent | null;
  seoStatus?: ImportSeoStatus;
  seoMessage?: string;
}
