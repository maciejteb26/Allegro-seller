import { useQuery } from '@tanstack/react-query';
import { Globe, Search } from 'lucide-react';
import { getSearchSettings } from '@/api/settings.api';

export function ExternalSearchBanner() {
  const { data } = useQuery({ queryKey: ['settings', 'search'], queryFn: getSearchSettings });
  if (!data) return null;

  if (data.mock) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Search className="h-4 w-4 shrink-0" />
        Wyszukiwanie mock — symulacja Google i sprzedawców (eBay, Amazon, Autodoc…). Ustaw{' '}
        <code className="rounded bg-white px-1">SERPAPI_KEY</code> lub Google CSE w server/.env.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <Globe className="h-4 w-4 shrink-0" />
      Wyszukiwanie aktywne ({data.mode}) — Google + {data.sellerCount} popularnych sprzedawców.
    </div>
  );
}
