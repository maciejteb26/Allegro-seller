import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Copy, Pencil, Trash2 } from 'lucide-react';
import { getListings, deleteListing, duplicateListing } from '@/api/listings.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/listings/StatusBadge';
import { LocalWizardDraftRow } from '@/components/listings/LocalWizardDraftRow';
import { useToast } from '@/components/ui/toast';
import { useLocalWizardDraft } from '@/hooks/useLocalWizardDraft';
import { Listing, ListingStatus } from '@/types';

const STATUS_FILTERS: { value: ListingStatus | ''; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  { value: 'DRAFT', label: 'Szkice' },
  { value: 'ACTIVE', label: 'Aktywne' },
  { value: 'ENDED', label: 'Zakończone' },
  { value: 'ERROR', label: 'Błędy' },
];

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function ListingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { meta: localDraft, dismiss: dismissLocalDraft } = useLocalWizardDraft();

  const { data, isLoading } = useQuery({
    queryKey: ['listings', search, statusFilter],
    queryFn: () =>
      getListings({
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast('Ogłoszenie usunięte', 'success');
    },
    onError: () => toast('Błąd podczas usuwania', 'error'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateListing(id),
    onSuccess: (listing) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast('Ogłoszenie zduplikowane', 'success');
      navigate(`/listings/${listing.id}/edit`);
    },
    onError: () => toast('Błąd podczas duplikowania', 'error'),
  });

  function handleDelete(listing: Listing) {
    if (!confirm(`Usunąć ogłoszenie "${listing.title}"?`)) return;
    deleteMutation.mutate(listing.id);
  }

  const items = data?.items ?? [];
  const showLocalDraft =
    localDraft &&
    (statusFilter === '' || statusFilter === 'DRAFT') &&
    (!search || (localDraft.title?.toLowerCase().includes(search.toLowerCase()) ?? true));
  const isEmpty = !isLoading && items.length === 0 && !showLocalDraft;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ogłoszenia</h1>
        <Button asChild>
          <Link to="/listings/new">
            <Plus className="h-4 w-4 mr-2" /> Dodaj ogłoszenie
          </Link>
        </Button>
      </div>

      {/* Filtry */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Szukaj ogłoszeń..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Zdjęcie</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tytuł</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Stan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cena bazowa</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

            {showLocalDraft && localDraft && (
              <LocalWizardDraftRow draft={localDraft} onDismiss={dismissLocalDraft} />
            )}

            {isEmpty && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {statusFilter === 'DRAFT' ? 'Brak szkiców' : 'Brak ogłoszeń'}
                  </p>
                  <Button asChild className="mt-3" variant="outline" size="sm">
                    <Link to="/listings/new">
                      {statusFilter === 'DRAFT' ? 'Rozpocznij nowy szkic' : 'Dodaj pierwsze ogłoszenie'}
                    </Link>
                  </Button>
                </td>
              </tr>
            )}

            {items.map((listing) => (
              <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {listing.images[0]?.url ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(listing.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {{ NEW: 'Nowy', USED: 'Używany', DAMAGED: 'Uszkodzony' }[listing.condition]}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {Number(listing.basePrice).toFixed(2)} PLN
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(listing.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                      title="Duplikuj"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(listing)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
