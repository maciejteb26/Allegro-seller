import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { getClients, setActiveClient } from '@/api/clients.api';
import { useToast } from '@/components/ui/toast';

export function ClientSelector() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const switchMut = useMutation({
    mutationFn: setActiveClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast('Zmieniono aktywnego klienta', 'success');
    },
    onError: () => toast('Nie udało się zmienić klienta', 'error'),
  });

  if (isLoading || !data?.clients.length) return null;

  const active = data.clients.find((c) => c.id === data.activeClientId) ?? data.clients[0];

  return (
    <div className="relative flex items-center gap-2">
      <Building2 className="h-4 w-4 text-ink-faint shrink-0" />
      <label className="sr-only" htmlFor="client-select">Aktywny klient</label>
      <select
        id="client-select"
        value={active?.id ?? ''}
        onChange={(e) => switchMut.mutate(e.target.value)}
        disabled={switchMut.isPending}
        className="h-9 max-w-[200px] truncate rounded-lg border border-stone-200 bg-white px-3 pr-8 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {data.clients.map((client) => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>
    </div>
  );
}
