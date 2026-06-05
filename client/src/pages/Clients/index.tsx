import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Client,
  VAT_OPTIONS,
  IMPORT_PROFILE_OPTIONS,
  SELLER_OPTIONS,
  createClient,
  deleteClient,
  getClients,
  setActiveClient,
  updateClient,
} from '@/api/clients.api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ClientForm } from './ClientForm';

export default function ClientsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Client | 'new' | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const createMut = useMutation({
    mutationFn: createClient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setEditing(null); toast('Klient dodany', 'success'); },
    onError: () => toast('Nie udało się dodać klienta', 'error'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateClient>[1] }) => updateClient(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setEditing(null); toast('Zapisano zmiany', 'success'); },
    onError: () => toast('Nie udało się zapisać', 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast('Klient usunięty', 'success'); },
    onError: () => toast('Nie udało się usunąć', 'error'),
  });

  const activeMut = useMutation({
    mutationFn: setActiveClient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast('Ustawiono aktywnego klienta', 'success'); },
  });

  const vatLabel = (rate: string) => VAT_OPTIONS.find((v) => v.value === rate)?.label ?? rate;
  const profileLabel = (p: string) => IMPORT_PROFILE_OPTIONS.find((v) => v.value === p)?.label ?? p;
  const sellersLabel = (domains: string[]) => {
    if (!domains.length) return 'Wszyscy';
    if (domains.length <= 2) {
      return domains.map((d) => SELLER_OPTIONS.find((s) => s.value === d)?.label ?? d).join(', ');
    }
    return `${domains.length} wybranych`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Klienci</h1>
          <p className="mt-1 text-sm text-ink-muted">VAT, faktury, sprzedawcy, własny prompt SEO i format Excel</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="mr-2 h-4 w-4" />Dodaj klienta</Button>
      </div>

      {editing === 'new' && (
        <ClientForm onSubmit={async (input) => { await createMut.mutateAsync(input); }} onCancel={() => setEditing(null)} />
      )}

      {editing && editing !== 'new' && (
        <ClientForm
          initial={editing}
          onSubmit={async (input) => { await updateMut.mutateAsync({ id: editing.id, input }); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-ink-muted">Ładowanie…</p>
      ) : !data?.clients.length ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm text-ink-muted">Dodaj pierwszego klienta, np. Subliva lub hurtownię</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.clients.map((client) => {
            const isActive = client.id === data.activeClientId;
            return (
              <div key={client.id} className={`rounded-2xl border bg-white p-5 shadow-soft ${isActive ? 'border-primary-300 ring-1 ring-primary-200' : 'border-stone-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink">{client.name}</h3>
                    {isActive && <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">Aktywny</span>}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditing(client)} className="rounded p-1.5 text-ink-faint hover:bg-surface-muted hover:text-ink" aria-label="Edytuj">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => deleteMut.mutate(client.id)} className="rounded p-1.5 text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label="Usuń">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-sm text-ink-muted">
                  <div className="flex justify-between"><dt>VAT</dt><dd className="font-medium text-ink">{vatLabel(client.vatRate)}</dd></div>
                  <div className="flex justify-between"><dt>Faktury</dt><dd className="font-medium text-ink">{client.issuesInvoices ? 'Tak' : 'Nie'}</dd></div>
                  <div className="flex justify-between"><dt>Import</dt><dd className="font-medium text-ink">{profileLabel(client.importProfile)}</dd></div>
                  <div className="flex justify-between"><dt>Sprzedawcy</dt><dd className="font-medium text-ink">{sellersLabel(client.sellerDomains)}</dd></div>
                  <div className="flex justify-between"><dt>Prompt SEO</dt><dd className="font-medium text-ink">{client.seoPrompt ? 'Własny' : 'Domyślny'}</dd></div>
                </dl>
                {!isActive && (
                  <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => activeMut.mutate(client.id)} disabled={activeMut.isPending}>
                    Ustaw jako aktywny
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
