import axios from 'axios';
import { EXTERNAL_SEARCH_SOURCE } from '../../constants/external-search.constants';
import { ExternalProductData } from '../../types/external-product.types';
import { matchSellerDomain, sellerLabelFromDomain } from './seller-domains';

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchSourceLink(url: string): Promise<ExternalProductData | null> {
  if (!url.trim() || !/^https?:\/\//i.test(url)) return null;

  try {
    const response = await axios.get<string>(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SzybkieWystawianie/1.0)' },
      responseType: 'text',
      validateStatus: (status) => status < 400,
    });

    const html = response.data;
    const title = extractMeta(html, 'og:title') || extractTag(html, 'title') || '';
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
    const image = extractMeta(html, 'og:image');

    if (!title && !description) return null;

    const domain = matchSellerDomain(url);
    return {
      title: decodeHtml(title),
      description: decodeHtml(description),
      language: detectLanguage(title, description),
      sourceUrl: url,
      sourceName: domain ? sellerLabelFromDomain(domain) : new URL(url).hostname,
      imageUrls: image ? [decodeHtml(image)] : [],
      hits: [{
        title: decodeHtml(title),
        url,
        snippet: decodeHtml(description).slice(0, 240),
        source: EXTERNAL_SEARCH_SOURCE.SOURCE_LINK,
        sellerName: domain ? sellerLabelFromDomain(domain) : undefined,
      }],
    };
  } catch {
    return null;
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'));
  return match?.[1]?.trim() ?? null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function detectLanguage(title: string, description: string): string | undefined {
  const text = `${title} ${description}`;
  if (/[äöüß]/i.test(text)) return 'de';
  if (/\b(the|and|for|with)\b/i.test(text)) return 'en';
  if (/[ąćęłńóśźż]/i.test(text)) return 'pl';
  return undefined;
}
