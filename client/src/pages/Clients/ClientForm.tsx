import { useState } from 'react';
import { Client, ClientInput, ClientImportProfile, ClientVatRate, IMPORT_PROFILE_OPTIONS, VAT_OPTIONS } from '@/api/clients.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientSellerPicker } from './ClientSellerPicker';
import { ClientSeoPromptField } from './ClientSeoPromptField';

interface ClientFormProps {
  initial?: Client;
  onSubmit: (data: ClientInput) => Promise<void>;
  onCancel: () => void;
}

export function ClientForm({ initial, onSubmit, onCancel }: ClientFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [vatRate, setVatRate] = useState<ClientVatRate>(initial?.vatRate ?? '23');
  const [issuesInvoices, setIssuesInvoices] = useState(initial?.issuesInvoices ?? false);
  const [importProfile, setImportProfile] = useState<ClientImportProfile>(initial?.importProfile ?? 'auto');
  const [seoPrompt, setSeoPrompt] = useState(initial?.seoPrompt ?? '');
  const [sellerDomains, setSellerDomains] = useState<string[]>(initial?.sellerDomains ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name,
        vatRate,
        issuesInvoices,
        importProfile,
        seoPrompt: seoPrompt.trim() || null,
        sellerDomains,
        notes: notes || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
      <div>
        <Label htmlFor="client-name">Nazwa klienta</Label>
        <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client-vat">Stawka VAT</Label>
          <select
            id="client-vat"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value as ClientVatRate)}
            className="mt-1 flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            {VAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="client-profile">Profil importu Excel</Label>
          <select
            id="client-profile"
            value={importProfile}
            onChange={(e) => setImportProfile(e.target.value as ClientImportProfile)}
            className="mt-1 flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm"
          >
            {IMPORT_PROFILE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-stone-200 bg-surface-muted px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={issuesInvoices}
          onChange={(e) => setIssuesInvoices(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-primary-600"
        />
        <div>
          <p className="text-sm font-medium text-ink">Wystawia faktury VAT</p>
          <p className="text-xs text-ink-muted">Uwzględniane przy generowaniu opisów i publikacji na Allegro</p>
        </div>
      </label>

      <ClientSellerPicker selected={sellerDomains} onChange={setSellerDomains} />
      <ClientSeoPromptField value={seoPrompt} onChange={setSeoPrompt} />

      <div>
        <Label htmlFor="client-notes">Notatki (opcjonalnie)</Label>
        <Input id="client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Anuluj</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Zapisuję…' : initial ? 'Zapisz zmiany' : 'Dodaj klienta'}</Button>
      </div>
    </form>
  );
}
