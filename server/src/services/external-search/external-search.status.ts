import { POPULAR_SELLER_DOMAINS } from '../../constants/external-search.constants';
import { env } from '../../utils/env';

export function getExternalSearchStatus() {
  const mode = env.EXTERNAL_SEARCH_MOCK
    ? 'MOCK'
    : env.SERPAPI_KEY
      ? 'SERPAPI'
      : 'GOOGLE_CSE';

  return {
    mode,
    mock: env.EXTERNAL_SEARCH_MOCK,
    sellerCount: POPULAR_SELLER_DOMAINS.length,
    sellers: POPULAR_SELLER_DOMAINS.slice(0, 6),
  };
}
