import axios, { AxiosError } from 'axios';
import { env } from '../utils/env';
import { AppError } from '../middleware/error.middleware';
import { getValidAccessToken } from './allegro-oauth.service';
import { AllegroCatalogProduct, IdentifierType } from '../types/import.types';

interface AllegroProductDto {
  id: string;
  name: string;
  category?: { id: string; name?: string };
  images?: Array<{ url: string }>;
  parameters?: Array<{ name?: string; values?: string[]; valuesLabels?: string[] }>;
  gtin?: string;
}

interface AllegroProductsResponse {
  products: AllegroProductDto[];
}

const ALLEGRO_BASE_URL = env.ALLEGRO_SANDBOX
  ? 'https://api.allegro.pl.allegrosandbox.pl'
  : 'https://api.allegro.pl';

const ACCEPT_HEADER = 'application/vnd.allegro.public.v1+json';

export async function searchAllegroCatalog(
  userId: string,
  phrase: string,
  mode: IdentifierType,
): Promise<AllegroCatalogProduct | null> {
  if (!phrase.trim()) return null;

  if (env.ALLEGRO_MOCK) {
    return mockCatalogProduct(phrase, mode);
  }

  const token = await getValidAccessToken(userId);
  const params: Record<string, string> = { phrase: phrase.trim() };
  if (mode === 'GTIN' || mode === 'MPN') params.mode = mode;

  try {
    const response = await axios.get<AllegroProductsResponse>(`${ALLEGRO_BASE_URL}/sale/products`, {
      params,
      headers: buildHeaders(token),
    });
    const product = response.data.products?.[0];
    return product ? mapProduct(product) : null;
  } catch (error) {
    throw toAppError(error);
  }
}

export async function enrichImportRows<T extends { searchPhrase: string; identifierType: IdentifierType }>(
  userId: string,
  rows: T[],
): Promise<Array<T & { allegroProduct: AllegroCatalogProduct | null; enrichStatus: 'matched' | 'not_found' | 'skipped' | 'error'; enrichMessage?: string }>> {
  const results: Array<T & { allegroProduct: AllegroCatalogProduct | null; enrichStatus: 'matched' | 'not_found' | 'skipped' | 'error'; enrichMessage?: string }> = [];

  for (const row of rows) {
    if (!row.searchPhrase.trim()) {
      results.push({ ...row, allegroProduct: null, enrichStatus: 'skipped', enrichMessage: 'Brak identyfikatora do wyszukania' });
      continue;
    }

    try {
      const product = await searchAllegroCatalog(userId, row.searchPhrase, row.identifierType);
      results.push({
        ...row,
        allegroProduct: product,
        enrichStatus: product ? 'matched' : 'not_found',
        enrichMessage: product ? undefined : 'Nie znaleziono w katalogu Allegro',
      });
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Błąd wyszukiwania w Allegro';
      results.push({ ...row, allegroProduct: null, enrichStatus: 'error', enrichMessage: message });
    }
  }

  return results;
}

function mapProduct(product: AllegroProductDto): AllegroCatalogProduct {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.category?.id ?? '',
    categoryName: product.category?.name,
    imageUrl: product.images?.[0]?.url,
    gtin: product.gtin,
  };
}

function mockCatalogProduct(phrase: string, mode: IdentifierType): AllegroCatalogProduct | null {
  // MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
  if (mode === 'PHRASE' && phrase.length < 4) return null;

  const slug = phrase.replace(/\W+/g, '-').slice(0, 24).toLowerCase();
  return {
    id: `mock-product-${slug}`,
    name: `[MOCK] ${phrase}`,
    categoryId: 'mock-category-3',
    categoryName: 'Motoryzacja',
    imageUrl: undefined,
    gtin: mode === 'GTIN' ? phrase : undefined,
  };
}

function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: ACCEPT_HEADER,
    'Content-Type': ACCEPT_HEADER,
    'Accept-Language': 'pl-PL',
    'User-Agent': env.ALLEGRO_USER_AGENT,
  };
}

function toAppError(error: unknown): AppError {
  const axiosError = error as AxiosError<{ errors?: Array<{ message?: string; userMessage?: string }> }>;
  const status = axiosError.response?.status ?? 502;
  const traceId = String(axiosError.response?.headers?.['trace-id'] ?? '') || null;
  const message =
    axiosError.response?.data?.errors?.[0]?.userMessage ??
    axiosError.response?.data?.errors?.[0]?.message ??
    axiosError.message;
  return new AppError(status, traceId ? `${message} (Trace-Id: ${traceId})` : message);
}
