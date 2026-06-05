export const EXTERNAL_SEARCH_SOURCE = {
  GOOGLE: 'google',
  SELLER: 'seller',
  SOURCE_LINK: 'source_link',
  MOCK: 'mock',
} as const;

export type ExternalSearchSourceId =
  (typeof EXTERNAL_SEARCH_SOURCE)[keyof typeof EXTERNAL_SEARCH_SOURCE];

export const POPULAR_SELLER_DOMAINS = [
  'ebay.com',
  'ebay.de',
  'ebay.pl',
  'amazon.de',
  'amazon.com',
  'amazon.co.uk',
  'autodoc.de',
  'autodoc.pl',
  'allegro.pl',
  'motointegrator.pl',
  'moto-faza.pl',
  'oponeo.pl',
  'ceneo.pl',
  'partslink24.com',
  'car-part.com',
  'rockauto.com',
] as const;

export const EXTERNAL_SEARCH_BATCH_SIZE = 3;
export const EXTERNAL_SEARCH_DELAY_MS = 400;

export const DEFAULT_IMPORT_CATEGORY_SLUG = 'general-misc';
