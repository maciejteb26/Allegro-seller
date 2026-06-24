import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getClients, VAT_OPTIONS } from '@/api/clients.api';
import { FileSpreadsheet, Rocket, Search, Sparkles, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ParsedImportRow,
  SeoImportRow,
  enrichImportRows,
  generateImportSeo,
  parseImportFile,
  publishImportRows,
} from '@/api/imports.api';
import { ImportRowsTable } from './ImportRowsTable';
import { AiStatusBanner } from './AiStatusBanner';
import { ExternalSearchBanner } from './ExternalSearchBanner';
import { exportImportRowsToCsv } from '@/utils/csv-export';

function toEnrichedRows(rows: ParsedImportRow[]): SeoImportRow[] {
  return rows.map((row) => ({
    ...row,
    enrichStatus: 'pending',
    allegroProduct: null,
    externalProduct: null,
    seoStatus: 'pending',
    seo: null,
  }));
}

export default function ImportsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [profileLabel, setProfileLabel] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientVat, setClientVat] = useState<string | null>(null);
  const [clientInvoices, setClientInvoices] = useState<boolean | null>(null);

  const { data: clientsData } = useQuery({ queryKey: ['clients'], queryFn: getClients });
  const activeClientId = clientsData?.activeClientId ?? clientsData?.clients[0]?.id;
  const [rows, setRows] = useState<SeoImportRow[]>([]);
  const [enrichSummary, setEnrichSummary] = useState<{ matched: number; notFound: number; errors: number } | null>(null);
  const [seoSummary, setSeoSummary] = useState<{ generated: number; aiCount: number; errors: number } | null>(null);
  const [publishSummary, setPublishSummary] = useState<{ published: number; skipped: number; errors: number } | null>(null);

  const parseMutation = useMutation({
    mutationFn: (file: File) => parseImportFile(file, activeClientId),
    onSuccess: (data) => {
      setFileName(data.fileName);
      setProfileLabel(data.profileLabel ?? data.profile);
      setClientName(data.client?.clientName ?? null);
      setClientVat(data.client?.vatRate ?? null);
      setClientInvoices(data.client?.issuesInvoices ?? null);
      setRows(toEnrichedRows(data.rows));
      setEnrichSummary(null);
      setSeoSummary(null);
      setPublishSummary(null);
      toast(`Wczytano ${data.totalRows} pozycji (${data.profileLabel ?? data.profile})`, 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg ?? 'Nie udało się wczytać pliku', 'error');
    },
  });

  const enrichMutation = useMutation({
    mutationFn: () => enrichImportRows(rows, activeClientId),
    onSuccess: (data) => {
      setRows(data.rows.map((row) => ({ ...row, seoStatus: 'pending', seo: null })));
      setEnrichSummary(data.summary);
      setSeoSummary(null);
      setPublishSummary(null);
      toast(
        `Znaleziono: ${data.summary.matched} · brak: ${data.summary.notFound} · błędy: ${data.summary.errors}`,
        data.summary.errors > 0 ? 'error' : 'success',
      );
    },
    onError: () => toast('Błąd wyszukiwania produktów', 'error'),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishImportRows(rows),
    onSuccess: (data) => {
      setRows(data.rows);
      setPublishSummary(data.summary);
      toast(
        `Allegro: ${data.summary.published} wystawionych, ${data.summary.skipped} pominiętych, ${data.summary.errors} błędów`,
        data.summary.errors > 0 ? 'error' : 'success',
      );
    },
    onError: () => toast('Błąd publikacji na Allegro', 'error'),
  });

  const seoMutation = useMutation({
    mutationFn: () => generateImportSeo(rows, activeClientId),
    onSuccess: (data) => {
      setRows(data.rows);
      setSeoSummary({
        generated: data.summary.generated,
        aiCount: data.summary.aiCount,
        errors: data.summary.errors,
      });
      toast(
        `SEO: ${data.summary.generated} wygenerowanych (${data.summary.aiCount} AI)`,
        data.summary.errors > 0 ? 'error' : 'success',
      );
    },
    onError: () => toast('Błąd generowania SEO', 'error'),
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) parseMutation.mutate(file);
    event.target.value = '';
  }

  const hasEnriched = rows.some((row) => row.enrichStatus !== 'pending');
  const hasSeo = rows.some((row) => row.seoStatus === 'generated');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import z Excel / CSV</h1>
        <p className="mt-1 text-sm text-gray-500">
          Plik Excel lub CSV → wyszukiwanie → tłumaczenie (AI) → wystawienie na Allegro.
        </p>
      </div>

      <div className="space-y-3">
        <AiStatusBanner />
        <ExternalSearchBanner />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={parseMutation.isPending}>
          <Upload className="mr-2 h-4 w-4" />
          {parseMutation.isPending ? 'Wczytywanie…' : 'Wybierz plik Excel / CSV'}
        </Button>

        {rows.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportImportRowsToCsv(rows, fileName ?? 'import-wynik.csv')}
          >
            <Download className="mr-2 h-4 w-4" />
            Eksportuj CSV
          </Button>
        )}

        {rows.length > 0 && (
          <Button variant="outline" onClick={() => enrichMutation.mutate()} disabled={enrichMutation.isPending}>
            <Search className="mr-2 h-4 w-4" />
            {enrichMutation.isPending ? 'Szukam produktów…' : 'Szukaj (Google + sprzedawcy + Allegro)'}
          </Button>
        )}

        {hasEnriched && (
          <Button variant="outline" onClick={() => seoMutation.mutate()} disabled={seoMutation.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            {seoMutation.isPending ? 'Tłumaczę i generuję SEO…' : 'Tłumacz na polski + SEO'}
          </Button>
        )}

        {hasSeo && (
          <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            <Rocket className="mr-2 h-4 w-4" />
            {publishMutation.isPending ? 'Wystawiam na Allegro…' : 'Wystaw na Allegro'}
          </Button>
        )}
      </div>

      {fileName && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <FileSpreadsheet className="h-4 w-4" />
          <span>{fileName}</span>
          {clientName && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{clientName}</span>}
          {profileLabel && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{profileLabel}</span>}
          {clientVat && <span className="text-xs text-gray-500">VAT {VAT_OPTIONS.find((v) => v.value === clientVat)?.label ?? clientVat}</span>}
          {clientInvoices !== null && <span className="text-xs text-gray-500">Faktura: {clientInvoices ? 'tak' : 'nie'}</span>}
          <span className="text-gray-400">· {rows.length} pozycji</span>
        </div>
      )}

      {!clientsData?.clients.length && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dodaj klienta w zakładce <a href="/clients" className="font-medium underline">Klienci</a>, aby ustawić VAT i faktury per profil.
        </p>
      )}

      {(enrichSummary || seoSummary) && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl lg:grid-cols-4">
          {enrichSummary && (
            <>
              <StatCard label="Dopasowane" value={enrichSummary.matched} tone="green" />
              <StatCard label="Brak w katalogu" value={enrichSummary.notFound} tone="amber" />
            </>
          )}
          {seoSummary && (
            <>
              <StatCard label="SEO wygenerowane" value={seoSummary.generated} tone="green" />
              <StatCard label="Przez AI" value={seoSummary.aiCount} tone="blue" />
            </>
          )}
          {publishSummary && (
            <>
              <StatCard label="Wystawione" value={publishSummary.published} tone="green" />
              <StatCard label="Błędy publikacji" value={publishSummary.errors} tone="red" />
            </>
          )}
        </div>
      )}

      <ImportRowsTable rows={rows} />

      {rows.length === 0 && !parseMutation.isPending && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            Obsługiwane formaty: <strong>Zestawienie</strong> (EAN, Tytuł), <strong>Lista produktów</strong> (produkt_nazwa, produkt_ean) lub <strong>CSV</strong> (średnik lub przecinek, UTF-8)
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'red' | 'blue';
}) {
  const tones = {
    green: 'text-green-700 bg-green-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
    blue: 'text-blue-700 bg-blue-50',
  };
  return (
    <div className={`rounded-lg px-4 py-3 ${tones[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
