import { POPULAR_SELLER_DOMAINS } from '../../constants/external-search.constants';

export function matchSellerDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const match = POPULAR_SELLER_DOMAINS.find((domain) => host === domain || host.endsWith(`.${domain}`));
    return match ?? null;
  } catch {
    return null;
  }
}

export function sellerLabelFromDomain(domain: string): string {
  const labels: Record<string, string> = {
    'ebay.com': 'eBay',
    'ebay.de': 'eBay DE',
    'ebay.pl': 'eBay PL',
    'amazon.de': 'Amazon DE',
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'autodoc.de': 'Autodoc',
    'autodoc.pl': 'Autodoc PL',
    'allegro.pl': 'Allegro',
    'motointegrator.pl': 'MotoIntegrator',
    'ceneo.pl': 'Ceneo',
    'rockauto.com': 'RockAuto',
  };
  return labels[domain] ?? domain;
}
