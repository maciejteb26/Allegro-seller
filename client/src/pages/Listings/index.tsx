import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Copy, Pencil, Trash2, Rocket, Settings2 } from 'lucide-react';
import { getListings, deleteListing, duplicateListing, publishListing, bulkUpdateAllegroSettings } from '@/api/listings.api';
import { getAllegroSaleSettings } from '@/api/platforms.api';
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
      {[...Array(7)].map((_, i) => (
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [showAllegroSettings, setShowAllegroSettings] = useState(false);
  const [bulkShippingRateId, setBulkShippingRateId] = useState('');
  const [bulkReturnPolicyId, setBulkReturnPolicyId] = useState('');
  const [bulkImpliedWarrantyId, setBulkImpliedWarrantyId] = useState('');
  const [bulkResponsibleProducerId, setBulkResponsibleProducerId] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { meta: localDraft, dismiss: dismissLocalDraft } = useLocalWizardDraft();

  const { data, isLoading } = useQuery({
    queryKey: ['listings', search, statusFilter, page, pageSize],
    queryFn: () =>
      getListings({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: pageSize,
      }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const { data: saleSettings } = useQuery({
    queryKey: ['allegro-sale-settings'],
    queryFn: getAllegroSaleSettings,
    enabled: showAllegroSettings,
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

  useEffect(() => {
    const validIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      items.length > 0 && items.every((item) => prev.has(item.id)) ? new Set() : new Set(items.map((item) => item.id)),
    );
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0 || !confirm(`Usunąć ${ids.length} zaznaczonych ogłoszeń?`)) return;

    setBulkProgress({ done: 0, total: ids.length });
    let success = 0;
    for (const id of ids) {
      try {
        await deleteListing(id);
        success += 1;
      } catch {
        // pomijamy - podsumowanie na koncu
      }
      setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
    }

    setBulkProgress(null);
    setSelectedIds(new Set());
    if (success === items.length && page > 1) setPage((p) => p - 1);
    qc.invalidateQueries({ queryKey: ['listings'] });
    const failed = ids.length - success;
    toast(
      failed > 0 ? `Usunięto ${success} z ${ids.length} (błędów: ${failed})` : `Usunięto ${success} ogłoszeń`,
      failed > 0 ? 'error' : 'success',
    );
  }

  async function handleBulkPublish() {
    const ids = [...selectedIds];
    if (ids.length === 0 || !confirm(`Wystawić ponownie ${ids.length} zaznaczonych ogłoszeń na Allegro?`)) return;

    setBulkProgress({ done: 0, total: ids.length });
    let success = 0;
    for (const id of ids) {
      try {
        const { results } = await publishListing(id);
        if (Object.values(results).every((status) => status === 'ACTIVE')) success += 1;
      } catch {
        // pomijamy - podsumowanie na koncu
      }
      setBulkProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
    }

    setBulkProgress(null);
    setSelectedIds(new Set());
    qc.invalidateQueries({ queryKey: ['listings'] });
    const failed = ids.length - success;
    toast(
      failed > 0
        ? `Wystawiono ${success} z ${ids.length} (błędów: ${failed})`
        : `Wystawiono ${success} ogłoszeń na Allegro`,
      failed > 0 ? 'error' : 'success',
    );
  }

  async function handleApplyAllegroSettings() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    try {
      const { updated } = await bulkUpdateAllegroSettings(ids, {
        allegroShippingRateId: bulkShippingRateId || undefined,
        allegroReturnPolicyId: bulkReturnPolicyId || undefined,
        allegroImpliedWarrantyId: bulkImpliedWarrantyId || undefined,
        allegroResponsibleProducerId: bulkResponsibleProducerId || undefined,
      });
      setShowAllegroSettings(false);
      setBulkShippingRateId('');
      setBulkReturnPolicyId('');
      setBulkImpliedWarrantyId('');
      setBulkResponsibleProducerId('');
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast(`Zaktualizowano ustawienia Allegro dla ${updated} ogłoszeń`, 'success');
    } catch {
      toast('Błąd podczas zapisywania ustawień Allegro', 'error');
    }
  }

  const showLocalDraft =
    localDraft &&
    (statusFilter === '' || statusFilter === 'DRAFT') &&
    (!search || (localDraft.title?.toLowerCase().includes(search.toLowerCase()) ?? true));
  const isEmpty = !isLoading && items.length === 0 && !showLocalDraft;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-ink tracking-tight">
          Ogłoszenia <span className="text-lg font-semibold text-ink-muted">· {data?.totalCount ?? items.length}</span>
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAllegroSettings((v) => !v)}
        >
          <Settings2 className="h-4 w-4 mr-1.5" /> Ustawienia Allegro
        </Button>
        <div className="ml-auto flex items-center gap-3 text-sm text-ink-muted">
          <label className="flex items-center gap-1.5">
            Na stronę:
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-warm-200 bg-white px-2 py-1 text-sm text-ink"
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>{data?.totalCount ?? 0} wyników</span>
        </div>
      </div>

      {/* Akcje grupowe */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-primary-900">Zaznaczono: {selectedIds.size}</span>
          {bulkProgress && (
            <span className="text-xs text-ink-muted">
              Przetwarzanie {bulkProgress.done}/{bulkProgress.total}…
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkPublish} disabled={!!bulkProgress}>
              <Rocket className="h-4 w-4 mr-1.5" /> Wystaw ponownie
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleBulkDelete}
              disabled={!!bulkProgress}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Usuń
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={!!bulkProgress}
              className="text-xs text-ink-muted hover:text-ink underline disabled:opacity-40"
            >
              Anuluj zaznaczenie
            </button>
          </div>
        </div>
      )}

      {showAllegroSettings && (
        <div className="rounded-lg border border-warm-200 bg-white p-4 space-y-3">
          <p className="text-xs text-ink-muted">
            Wybierz dostawę / zwroty / rękojmię, zaznacz checkboxem ogłoszenia w tabeli poniżej, którym chcesz
            je przypisać, i kliknij "Zastosuj". Zostaw "— bez zmian —" dla pola, którego nie chcesz zmieniać.
          </p>
          {selectedIds.size === 0 && (
            <p className="text-xs font-medium text-amber-700">
              Nie zaznaczono żadnych ogłoszeń — zaznacz je checkboxem w tabeli poniżej.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-ink-muted">Dostawa</label>
              <select
                value={bulkShippingRateId}
                onChange={(e) => setBulkShippingRateId(e.target.value)}
                className="mt-1 w-full rounded-md border border-warm-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">— bez zmian —</option>
                {saleSettings?.shippingRates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Zwroty</label>
              <select
                value={bulkReturnPolicyId}
                onChange={(e) => setBulkReturnPolicyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-warm-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">— bez zmian —</option>
                {saleSettings?.returnPolicies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Rękojmia</label>
              <select
                value={bulkImpliedWarrantyId}
                onChange={(e) => setBulkImpliedWarrantyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-warm-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">— bez zmian —</option>
                {saleSettings?.impliedWarranties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">Producent odpowiedzialny</label>
              <select
                value={bulkResponsibleProducerId}
                onChange={(e) => setBulkResponsibleProducerId(e.target.value)}
                className="mt-1 w-full rounded-md border border-warm-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">— bez zmian —</option>
                {saleSettings?.responsibleProducers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowAllegroSettings(false)}>
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={handleApplyAllegroSettings}
              disabled={
                selectedIds.size === 0 ||
                (!bulkShippingRateId && !bulkReturnPolicyId && !bulkImpliedWarrantyId && !bulkResponsibleProducerId)
              }
            >
              Zastosuj do zaznaczonych {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-xl border border-warm-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50 text-ink-muted text-xs font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-warm-300"
                  aria-label="Zaznacz wszystkie"
                />
              </th>
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
                <td colSpan={7} className="px-4 py-16 text-center">
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
                  <input
                    type="checkbox"
                    checked={selectedIds.has(listing.id)}
                    onChange={() => toggleSelect(listing.id)}
                    className="h-4 w-4 rounded border-warm-300"
                    aria-label={`Zaznacz ${listing.title}`}
                  />
                </td>
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
                  <p className="font-medium text-ink line-clamp-1 uppercase">{listing.title}</p>
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

      {/* Paginacja */}
      {!isLoading && (data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={page <= 1}>
            « Pierwsza
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            ‹ Poprzednia
          </Button>
          <span className="flex items-center gap-1.5 px-2 text-sm text-ink-muted">
            Strona
            <input
              type="number"
              min={1}
              max={data?.totalPages ?? 1}
              value={page}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isNaN(value)) setPage(Math.min(Math.max(1, value), data?.totalPages ?? 1));
              }}
              className="w-14 rounded-md border border-warm-200 bg-white px-2 py-1 text-center text-sm text-ink"
            />
            z {data?.totalPages ?? 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
            disabled={page >= (data?.totalPages ?? 1)}
          >
            Następna ›
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(data?.totalPages ?? 1)}
            disabled={page >= (data?.totalPages ?? 1)}
          >
            Ostatnia »
          </Button>
        </div>
      )}
    </div>
  );
}
