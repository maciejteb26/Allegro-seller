import axios from 'axios';
import { env } from '../../utils/env';
import { EXTERNAL_SEARCH_SOURCE } from '../../constants/external-search.constants';
import { ExternalProductHit } from '../../types/external-product.types';
import { matchSellerDomain, sellerLabelFromDomain } from './seller-domains';

interface SerpApiResult {
  organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
}

interface GoogleCseResult {
  items?: Array<{ title?: string; link?: string; snippet?: string }>;
}

export async function searchGoogle(phrase: string): Promise<ExternalProductHit[]> {
  if (!phrase.trim()) return [];

  if (env.SERPAPI_KEY) return searchViaSerpApi(phrase);
  if (env.GOOGLE_CSE_API_KEY && env.GOOGLE_CSE_CX) return searchViaGoogleCse(phrase);
  return [];
}

async function searchViaSerpApi(phrase: string): Promise<ExternalProductHit[]> {
  const response = await axios.get<SerpApiResult>('https://serpapi.com/search.json', {
    params: { q: phrase, api_key: env.SERPAPI_KEY, num: 8, hl: 'pl' },
    timeout: 12_000,
  });
  return mapHits(response.data.organic_results ?? []);
}

async function searchViaGoogleCse(phrase: string): Promise<ExternalProductHit[]> {
  const response = await axios.get<GoogleCseResult>('https://www.googleapis.com/customsearch/v1', {
    params: { key: env.GOOGLE_CSE_API_KEY, cx: env.GOOGLE_CSE_CX, q: phrase, num: 8, lr: 'lang_pl|lang_en|lang_de' },
    timeout: 12_000,
  });
  return mapHits(response.data.items ?? []);
}

function mapHits(
  items: Array<{ title?: string; link?: string; snippet?: string }>,
): ExternalProductHit[] {
  return items
    .filter((item) => item.link && item.title)
    .map((item) => {
      const domain = matchSellerDomain(item.link!);
      return {
        title: item.title!,
        url: item.link!,
        snippet: item.snippet ?? '',
        source: domain ? EXTERNAL_SEARCH_SOURCE.SELLER : EXTERNAL_SEARCH_SOURCE.GOOGLE,
        sellerName: domain ? sellerLabelFromDomain(domain) : undefined,
        language: detectLanguage(item.title!, item.snippet ?? ''),
      };
    });
}

function detectLanguage(title: string, snippet: string): string | undefined {
  const text = `${title} ${snippet}`;
  if (/[äöüß]/i.test(text)) return 'de';
  if (/\b(the|and|for|with|new|used)\b/i.test(text)) return 'en';
  if (/[ąćęłńóśźż]/i.test(text)) return 'pl';
  return undefined;
}
