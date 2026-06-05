import { POPULAR_SELLER_DOMAINS } from './external-search.constants';
import { sellerLabelFromDomain } from '../services/external-search/seller-domains';

export const CLIENT_VAT_RATES = ['23', '8', '5', '0', 'zw'] as const;
export type ClientVatRate = (typeof CLIENT_VAT_RATES)[number];

export const CLIENT_IMPORT_PROFILES = ['auto', 'zestawienie', 'lista_produktow'] as const;
export type ClientImportProfile = (typeof CLIENT_IMPORT_PROFILES)[number];

export const CLIENT_SEO_PROMPT_MAX_LENGTH = 2000;

export const CLIENT_SELLER_OPTIONS = POPULAR_SELLER_DOMAINS.map((domain) => ({
  value: domain,
  label: sellerLabelFromDomain(domain),
}));

export const CLIENT_VAT_LABELS: Record<ClientVatRate, string> = {
  '23': '23%',
  '8': '8%',
  '5': '5%',
  '0': '0%',
  zw: 'Zwolniony',
};
