import axios, { AxiosError } from 'axios';
import { Platform } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
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

async function getAllegroToken(userId: string): Promise<string> {
  // Auto-refresh jeśli token wygasa w ciągu 5 minut
  return getValidAccessToken(userId);
}

export async function uploadImageToAllegro(userId: string, imageUrl: string): Promise<string> {
  const token = await getAllegroToken(userId);
  const response = await axios.post<{ imageId: string }>(
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
  return response.data.imageId;
}

export async function createAllegroOffer(
  userId: string,
  payload: Record<string, unknown>,
): Promise<{ id: string }> {
  const token = await getAllegroToken(userId);
  const response = await axios.post<{ id: string }>(
    `${ALLEGRO_BASE_URL}/sale/offers`,
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
