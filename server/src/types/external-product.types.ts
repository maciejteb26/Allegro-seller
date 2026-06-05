import { ExternalSearchSourceId } from '../constants/external-search.constants';

export interface ExternalProductHit {
  title: string;
  url: string;
  snippet: string;
  source: ExternalSearchSourceId;
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
