import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getClients, VAT_OPTIONS } from '@/api/clients.api';
import { FileSpreadsheet, Rocket, Search, Sparkles, Upload, Download, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  ImportProgress,
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
import { Stepper } from './Stepper';
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
  const [enrichProgress, setEnrichProgress] = useState<ImportProgress | null>(null);
  const [seoProgress, setSeoProgress] = useState<ImportProgress | null>(null);

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
    mutationFn: () => {
      setEnrichProgress(null);
      return enrichImportRows(rows, activeClientId, setEnrichProgress);
    },
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
    onSettled: () => setEnrichProgress(null),
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
    mutationFn: () => {
      setSeoProgress(null);
      return generateImportSeo(rows, activeClientId, setSeoProgress);
    },
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
    onSettled: () => setSeoProgress(null),
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) parseMutation.mutate(file);
    event.target.value = '';
  }

  const hasEnriched = rows.some((row) => row.enrichStatus !== 'pending');
  const hasSeo = rows.some((row) => row.seoStatus === 'generated');
  const hasPublished = !!publishSummary && publishSummary.published > 0;

  // Determine stepper step
  const currentStep = hasSeo ? 4 : hasEnriched ? 3 : rows.length > 0 ? 2 : 1;

  // Summary counts
  const summaryCards = [
    { label: 'Znalezione', value: enrichSummary?.matched ?? 0, color: 'text-green-600' },
    { label: 'Brak w kat.', value: enrichSummary?.notFound ?? 0, color: 'text-amber-600' },
    { label: 'SEO gotowe', value: seoSummary?.generated ?? 0, color: 'text-blue-600' },
    { label: 'Wystawione', value: publishSummary?.published ?? 0, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold text-ink tracking-tight">Import Excel</h1>
        <p className="text-sm text-ink-muted mt-1">
          Wgraj plik, znajdź dane, wygeneruj SEO i wystaw na Allegro.
        </p>
      </div>

      {/* Info banners */}
      <div className="flex flex-col gap-2.5">
        <AiStatusBanner />
        <ExternalSearchBanner />
      </div>

      {/* Missing client warning */}
      {!clientsData?.clients.length && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dodaj klienta w zakładce{' '}
          <a href="/clients" className="font-medium underline">Klienci</a>, aby ustawić VAT i faktury per profil.
        </p>
      )}

      {/* Stepper */}
      <Stepper currentStep={currentStep} />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Dropzone (no file loaded) */}
      {rows.length === 0 && !parseMutation.isPending && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-warm-200 rounded-2xl py-14 px-8 text-center cursor-pointer bg-white hover:border-primary-600 hover:bg-primary-50 transition-colors"
        >
          <Upload className="mx-auto h-10 w-10 text-warm-300 mb-4" />
          <p className="text-lg font-bold text-ink mb-1.5">Przeciągnij plik tutaj</p>
          <p className="text-sm text-ink-muted mb-5">lub kliknij, aby wybrać</p>
          <div className="inline-flex flex-col gap-1 text-xs text-ink-muted bg-warm-50 rounded-xl px-5 py-3">
            <span>Obsługiwane: <strong className="font-mono text-ink">.xlsx · .xls · .csv</strong></span>
            <span>Format: „Zestawienie" lub „Lista produktów"</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {parseMutation.isPending && (
        <div className="flex items-center justify-center py-16 bg-white border border-warm-200 rounded-xl">
          <div className="text-sm text-ink-muted">Wczytywanie pliku…</div>
        </div>
      )}

      {/* File loaded: header + summary + table + action bar */}
      {rows.length > 0 && (
        <>
          {/* File header */}
          <div className="bg-white border border-warm-200 rounded-xl rounded-b-none border-b-0 px-5 py-4 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm font-mono text-ink">{fileName}</p>
                <p className="text-xs text-ink-muted">
                  {rows.length} pozycji
                  {profileLabel && <> · profil: <strong>{profileLabel}</strong></>}
                  {clientName && <> · klient: <strong>{clientName}</strong></>}
                  {clientVat && <> · VAT: {VAT_OPTIONS.find((v) => v.value === clientVat)?.label ?? clientVat}</>}
                  {clientInvoices !== null && <> · Faktura: {clientInvoices ? 'tak' : 'nie'}</>}
                </p>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          {(enrichSummary || seoSummary || publishSummary) && (
            <div className="bg-white border-x border-warm-200 px-5 py-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summaryCards.map(({ label, value, color }) => (
                <div key={label} className="border border-warm-200 rounded-lg px-3.5 py-2.5">
                  <div className="text-xs text-ink-muted font-medium">{label}</div>
                  <div className={`text-xl font-extrabold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-white border-x border-warm-200">
            <ImportRowsTable rows={rows} />
          </div>

          {/* Success banner */}
          {hasPublished && (
            <div className="bg-green-50 border-x border-warm-200 border-t border-green-100 px-5 py-4 flex items-center gap-4 flex-wrap">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <p className="font-bold text-green-800 flex-1">
                Wystawiono {publishSummary.published} ogłoszeń na Allegro!
              </p>
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                <Link to="/listings">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Zobacz wystawione ogłoszenia
                </Link>
              </Button>
            </div>
          )}

          {/* Sticky action bar */}
          <div className="relative sticky bottom-0 bg-white border border-warm-200 rounded-b-xl px-5 py-3.5 flex items-center gap-2.5 flex-wrap shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-10">
            {(enrichProgress || seoProgress) && (
              <div className="absolute inset-x-0 top-0 h-0.5 bg-warm-100 overflow-hidden rounded-t-xl">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{
                    width: `${(((enrichProgress ?? seoProgress)!.done / (enrichProgress ?? seoProgress)!.total) * 100).toFixed(0)}%`,
                  }}
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="border-warm-200 text-ink hover:bg-warm-50"
            >
              Wgraj nowy plik
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportImportRowsToCsv(rows, fileName ?? 'import-wynik.csv')}
              className="border-warm-200 text-ink hover:bg-warm-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Eksportuj CSV
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => enrichMutation.mutate()}
              disabled={enrichMutation.isPending}
              className="border-warm-200 text-ink hover:bg-warm-50"
            >
              <Search className="mr-2 h-4 w-4" />
              {enrichMutation.isPending
                ? `Szukam… ${enrichProgress ? `(${enrichProgress.done}/${enrichProgress.total})` : ''}`
                : 'Szukaj produkty'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => seoMutation.mutate()}
              disabled={seoMutation.isPending || !hasEnriched}
              className="border-warm-200 text-ink hover:bg-warm-50 disabled:opacity-40"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {seoMutation.isPending
                ? `Generuję SEO… ${seoProgress ? `(${seoProgress.done}/${seoProgress.total})` : ''}`
                : 'Generuj SEO'}
            </Button>

            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || !hasSeo}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-sm disabled:opacity-40"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {publishMutation.isPending ? 'Wystawiam…' : 'Wystaw na Allegro'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
