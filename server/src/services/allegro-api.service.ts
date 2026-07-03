import axios, { AxiosError } from 'axios';
import { Platform } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { getValidAccessToken } from './allegro-oauth.service';

interface AllegroMeResponse {
  id: string;
  login: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: { name?: string };
}

interface AllegroCategory {
  id: string;
  name: string;
  leaf: boolean;
}

interface AllegroCategoryResponse {
  categories: AllegroCategory[];
}

interface AllegroMatchingCategoriesResponse {
  matchingCategories: AllegroCategory[];
}

export interface AllegroCategoryParameter {
  id: string;
  name: string;
  required: boolean;
  dictionary?: Array<{ id: string; value: string }>;
}

interface AllegroCategoryParametersResponse {
  parameters: AllegroCategoryParameter[];
}

interface AllegroRequestResult<T> {
  data: T;
  traceId: string | null;
}

const ALLEGRO_BASE_URL = env.ALLEGRO_SANDBOX
  ? 'https://api.allegro.pl.allegrosandbox.pl'
  : 'https://api.allegro.pl';

const ACCEPT_HEADER = 'application/vnd.allegro.public.v1+json';

export async function getAllegroMe(userId: string): Promise<AllegroMeResponse> {
  const token = await getAllegroToken(userId);
  const result = await requestWithRetry<AllegroMeResponse>(`${ALLEGRO_BASE_URL}/me`, token);
  return result.data;
}

export async function getAllegroCategoryParameters(
  userId: string,
  categoryId: string,
): Promise<AllegroRequestResult<AllegroCategoryParameter[]>> {
  const token = await getAllegroToken(userId);
  const url = `${ALLEGRO_BASE_URL}/sale/categories/${encodeURIComponent(categoryId)}/parameters`;
  const result = await requestWithRetry<AllegroCategoryParametersResponse>(url, token);
  return { data: result.data.parameters ?? [], traceId: result.traceId };
}

export async function getAllegroCategories(
  userId: string,
  parentId?: string,
): Promise<AllegroRequestResult<AllegroCategory[]>> {
  const token = await getAllegroToken(userId);
  const query = parentId ? `?parent.id=${encodeURIComponent(parentId)}` : '';
  const url = `${ALLEGRO_BASE_URL}/sale/categories${query}`;
  const result = await requestWithRetry<AllegroCategoryResponse>(url, token);
  return { data: result.data.categories ?? [], traceId: result.traceId };
}

// MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
export async function getAllegroMatchingCategories(
  userId: string,
  phrase: string,
): Promise<AllegroRequestResult<AllegroCategory[]>> {
  const token = await getAllegroToken(userId);
  const url = `${ALLEGRO_BASE_URL}/sale/matching-categories?name=${encodeURIComponent(phrase)}`;
  const result = await requestWithRetry<AllegroMatchingCategoriesResponse>(url, token);
  return { data: result.data.matchingCategories ?? [], traceId: result.traceId };
}

export async function saveAllegroMappings(
  userId: string,
  items: Array<{
    internalCategoryId: string;
    externalCategoryId: string;
    externalCategoryName?: string;
    attributeSchema?: object;
  }>,
): Promise<{ updated: number }> {
  await Promise.all(
    items.map((item) =>
      prisma.platformCategoryMapping.upsert({
        where: {
          internalCategoryId_platform: {
            internalCategoryId: item.internalCategoryId,
            platform: Platform.ALLEGRO,
          },
        },
        create: {
          internalCategoryId: item.internalCategoryId,
          platform: Platform.ALLEGRO,
          externalCategoryId: item.externalCategoryId,
          externalCategoryName: item.externalCategoryName,
          attributeSchema: item.attributeSchema ?? {},
        },
        update: {
          externalCategoryId: item.externalCategoryId,
          externalCategoryName: item.externalCategoryName,
          attributeSchema: item.attributeSchema ?? {},
          cachedAt: new Date(),
        },
      }),
    ),
  );

  await prisma.userPlatform.updateMany({
    where: { userId, platform: Platform.ALLEGRO },
    data: { isActive: true },
  });

  return { updated: items.length };
}

interface AllegroSellerOfferSummary {
  id: string;
  stats?: { visitsCount?: number; watchersCount?: number };
  stock?: { sold?: number };
}

interface AllegroOffersListResponse {
  offers?: AllegroSellerOfferSummary[];
}

export async function getAllegroSellerOffers(
  userId: string,
  offerIds: string[],
): Promise<AllegroSellerOfferSummary[]> {
  if (offerIds.length === 0) return [];

  const token = await getAllegroToken(userId);
  const wanted = new Set(offerIds);
  const found = new Map<string, AllegroSellerOfferSummary>();
  let offset = 0;
  const limit = 100;

  while (found.size < offerIds.length) {
    const url = `${ALLEGRO_BASE_URL}/sale/offers?publication.status=ACTIVE&limit=${limit}&offset=${offset}`;
    const result = await requestWithRetry<AllegroOffersListResponse>(url, token);
    const batch = result.data.offers ?? [];
    if (batch.length === 0) break;

    for (const offer of batch) {
      if (wanted.has(offer.id)) found.set(offer.id, offer);
    }

    offset += limit;
    if (batch.length < limit || offset > 5000) break;
  }

  for (const id of offerIds) {
    if (found.has(id)) continue;
    const url = `${ALLEGRO_BASE_URL}/sale/offers?offer.id=${encodeURIComponent(id)}`;
    const result = await requestWithRetry<AllegroOffersListResponse>(url, token);
    const offer = result.data.offers?.[0];
    if (offer) found.set(offer.id, offer);
  }

  return [...found.values()];
}

async function getAllegroToken(userId: string): Promise<string> {
  // Auto-refresh jeśli token wygasa w ciągu 5 minut
  return getValidAccessToken(userId);
}

export async function uploadImageToAllegro(userId: string, imageUrl: string): Promise<string> {
  const token = await getAllegroToken(userId);
  let response;
  try {
    response = await axios.post<{ location: string }>(
      `${ALLEGRO_BASE_URL}/sale/images`,
      { url: imageUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': ACCEPT_HEADER,
          Accept: ACCEPT_HEADER,
          'User-Agent': env.ALLEGRO_USER_AGENT,
        },
      },
    );
  } catch (error) {
    throw toOfferError(error);
  }
  return response.data.location;
}

// /sale/offers (klasyczny endpoint) jest wyłączony dla integracji od 2024 — patrz:
// https://developer.allegro.pl/news/na-poczatku-2024-roku-wylaczymy-zasoby-sale-offers-sluzace-do-tworzenia-i-edycji-ofert-BvqK3XOaEcW
// Aktualny endpoint to /sale/product-offers (oferty oparte o katalog produktów Allegro).
export async function createAllegroProductOffer(
  userId: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const token = await getAllegroToken(userId);
  try {
    const response = await axios.post<{ id: string }>(
      `${ALLEGRO_BASE_URL}/sale/product-offers`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': ACCEPT_HEADER,
          Accept: ACCEPT_HEADER,
          'Accept-Language': 'pl-PL',
          'User-Agent': env.ALLEGRO_USER_AGENT,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw toOfferError(error, payload);
  }
}

function toOfferError(error: unknown, payload?: Record<string, unknown>): AppError {
  const axiosError = error as AxiosError<{
    errors?: Array<{ message?: string; userMessage?: string; path?: string; code?: string }>;
  }>;
  const status = axiosError.response?.status ?? 502;
  const errors = axiosError.response?.data?.errors;
  const details = errors?.map((e) => `${e.path ?? ''} ${e.userMessage ?? e.message ?? ''}`.trim()).join('; ');

  // Logujemy pełen payload + surową odpowiedź Allegro — komunikaty walidacji bywają mylące
  // (np. błędny parametr wskazuje na inne pole niż faktyczna przyczyna), więc do diagnozy
  // trzeba widzieć oba naraz.
  logger.warn('allegro_api_request_failed', { status, errors, payload });

  return new AppError(status, details || axiosError.message);
}

async function requestWithRetry<T>(url: string, token: string): Promise<AllegroRequestResult<T>> {
  let delayMs = 400;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.get<T>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: ACCEPT_HEADER,
          'Content-Type': ACCEPT_HEADER,
          'Accept-Language': 'pl-PL',
          'User-Agent': env.ALLEGRO_USER_AGENT,
        },
      });
      return {
        data: response.data,
        traceId: String(response.headers['trace-id'] ?? '') || null,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ errors?: Array<{ message?: string; userMessage?: string }> }>;
      const status = axiosError.response?.status;
      const traceId = String(axiosError.response?.headers?.['trace-id'] ?? '') || null;

      if ((status === 429 || status === 503) && attempt < 2) {
        await sleep(delayMs);
        delayMs *= 2;
        continue;
      }

      const message =
        axiosError.response?.data?.errors?.[0]?.userMessage ??
        axiosError.response?.data?.errors?.[0]?.message ??
        axiosError.message;
      throw new AppError(status ?? 502, traceId ? `${message} (Trace-Id: ${traceId})` : message);
    }
  }

  throw new AppError(502, 'Allegro API request failed after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
