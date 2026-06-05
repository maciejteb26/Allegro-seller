import { EXTERNAL_SEARCH_SOURCE } from '../../constants/external-search.constants';
import { ExternalProductData, ExternalProductHit } from '../../types/external-product.types';
import { ParsedImportRow } from '../../types/import.types';
import { env } from '../../utils/env';
import { searchGoogle } from './google-search.service';
import { fetchSourceLink } from './source-link.fetcher';
import { mockExternalProduct } from './external-search.mock';
import { matchSellerDomain } from './seller-domains';

export interface ExternalSearchOptions {
  allowedSellerDomains?: string[];
}

export async function searchExternalProduct(
  row: ParsedImportRow,
  options?: ExternalSearchOptions,
): Promise<ExternalProductData | null> {
  if (env.EXTERNAL_SEARCH_MOCK) {
    // MOCK MODE — wymaga SERPAPI_KEY lub GOOGLE_CSE_API_KEY dla prawdziwego wyszukiwania
    return filterMockBySellers(mockExternalProduct(row), options?.allowedSellerDomains);
  }

  const phrase = buildSearchPhrase(row);
  if (!phrase) return null;

  const allowed = options?.allowedSellerDomains?.length ? new Set(options.allowedSellerDomains) : null;
  const fromLink = row.sourceLink ? await fetchSourceLink(row.sourceLink) : null;
  const googleHits = filterHitsBySellers(await searchGoogle(phrase), allowed);
  const sellerHit = pickBestSellerHit(googleHits);

  if (fromLink && isLinkAllowed(fromLink.sourceUrl, allowed)) {
    return mergeExternalData(fromLink, googleHits);
  }
  if (sellerHit) return hitToProductData(sellerHit, googleHits);
  if (googleHits[0]) return hitToProductData(googleHits[0], googleHits);

  return null;
}

function filterHitsBySellers(
  hits: ExternalProductHit[],
  allowed: Set<string> | null,
): ExternalProductHit[] {
  if (!allowed?.size) return hits;
  return hits.filter((hit) => isLinkAllowed(hit.url, allowed));
}

function isLinkAllowed(url: string, allowed: Set<string> | null): boolean {
  if (!allowed?.size) return true;
  const domain = matchSellerDomain(url);
  return domain ? allowed.has(domain) : false;
}

function filterMockBySellers(
  product: ExternalProductData,
  allowedDomains?: string[],
): ExternalProductData | null {
  if (!allowedDomains?.length) return product;
  const allowed = new Set(allowedDomains);
  const hits = product.hits.filter((hit) => {
    const domain = matchSellerDomain(hit.url);
    return domain && allowed.has(domain);
  });
  if (!hits.length) return null;
  return { ...product, hits, sourceName: hits[0].sellerName ?? product.sourceName, sourceUrl: hits[0].url };
}

function buildSearchPhrase(row: ParsedImportRow): string {
  const parts = [row.identifierType === 'GTIN' ? row.searchPhrase : null, row.draftTitle, row.signature]
    .filter(Boolean)
    .map((value) => String(value).trim());
  return [...new Set(parts)].join(' ').trim();
}

function pickBestSellerHit(hits: ExternalProductHit[]): ExternalProductHit | null {
  const sellerHits = hits.filter((hit) => hit.source === EXTERNAL_SEARCH_SOURCE.SELLER || matchSellerDomain(hit.url));
  return sellerHits[0] ?? null;
}

function hitToProductData(primary: ExternalProductHit, hits: ExternalProductHit[]): ExternalProductData {
  return {
    title: primary.title,
    description: primary.snippet,
    language: primary.language,
    sourceUrl: primary.url,
    sourceName: primary.sellerName ?? 'Google',
    imageUrls: [],
    hits,
  };
}

function mergeExternalData(fromLink: ExternalProductData, googleHits: ExternalProductHit[]): ExternalProductData {
  const mergedHits = [...fromLink.hits, ...googleHits.filter((hit) => hit.url !== fromLink.sourceUrl)];
  return { ...fromLink, hits: mergedHits };
}
