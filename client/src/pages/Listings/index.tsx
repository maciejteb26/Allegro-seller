import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Copy, Pencil, Trash2, Rocket } from 'lucide-react';
import { getListings, deleteListing, duplicateListing, publishListing } from '@/api/listings.api';
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
    <tr className="border-t border-warm-100">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-warm-100 animate-pulse" style={{ width: `${60 + i * 10}%` }} />
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

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishListing(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      const failed = Object.values(data.results).some((s) => s !== 'ACTIVE');
      toast(failed ? 'Publikacja zakończona z błędami' : 'Wystawiono na Allegro', failed ? 'error' : 'success');
    },
    onError: () => toast('Błąd podczas publikacji', 'error'),
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-ink tracking-tight">
          Ogłoszenia <span className="text-lg font-semibold text-ink-muted">· {items.length}</span>
        </h1>
        <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm">
          <Link to="/listings/new">
            <Plus className="h-4 w-4 mr-2" /> Dodaj ogłoszenie
          </Link>
        </Button>
      </div>

      {/* Filtry */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-0.5 bg-white border border-warm-200 rounded-lg p-[3px]">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-primary-600 text-white'
                  : 'text-ink-muted hover:bg-warm-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <Input
            placeholder="Szukaj po tytule lub EAN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="ml-auto text-sm text-ink-muted">{items.length} wyników</div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-warm-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 text-ink-muted text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Zdjęcie</th>
              <th className="px-4 py-3 text-left">Tytuł</th>
              <th className="px-4 py-3 text-left">Stan</th>
              <th className="px-4 py-3 text-left">Cena bazowa</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Akcje</th>
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm-50 mx-auto mb-4">
                    <Package className="h-6 w-6 text-ink-muted" />
                  </div>
                  <p className="text-sm text-ink-muted">
                    {statusFilter === 'DRAFT' ? 'Brak szkiców' : 'Brak ogłoszeń'}
                  </p>
                  <Button asChild className="mt-4" variant="outline" size="sm">
                    <Link to="/listings/new">
                      {statusFilter === 'DRAFT' ? 'Rozpocznij nowy szkic' : 'Dodaj pierwsze ogłoszenie'}
                    </Link>
                  </Button>
                </td>
              </tr>
            )}

            {items.map((listing) => (
              <tr key={listing.id} className="border-t border-warm-100 hover:bg-warm-50 transition-colors">
                <td className="px-4 py-3">
                  {listing.images[0]?.url ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-10 w-10 rounded-lg object-cover border border-warm-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-warm-100 flex items-center justify-center border border-warm-200">
                      <Package className="h-4 w-4 text-ink-muted" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink line-clamp-1">{listing.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {new Date(listing.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {{ NEW: 'Nowy', USED: 'Używany', DAMAGED: 'Uszkodzony' }[listing.condition]}
                </td>
                <td className="px-4 py-3 font-semibold text-ink">
                  {Number(listing.basePrice).toFixed(2)} PLN
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {(listing.status === 'ERROR' || listing.status === 'PUBLISHING' || listing.status === 'DRAFT') && (
                      <button
                        onClick={() => publishMutation.mutate(listing.id)}
                        disabled={publishMutation.isPending}
                        className="p-1.5 rounded-md hover:bg-warm-100 text-ink-muted hover:text-ink disabled:opacity-40"
                        title="Wystaw ponownie na Allegro"
                      >
                        <Rocket className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                      className="p-1.5 rounded-md hover:bg-warm-100 text-ink-muted hover:text-ink"
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(listing.id)}
                      className="p-1.5 rounded-md hover:bg-warm-100 text-ink-muted hover:text-ink"
                      title="Duplikuj"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(listing)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
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
