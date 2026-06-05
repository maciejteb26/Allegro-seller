import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { ParsedListingData } from '@/api/ai-parser.api';
import { InternalCategory } from '@/types';
import { CONDITION_LABELS } from '@/pages/Listings/wizard/constants';
import { getCategoryLabel } from '@/pages/Listings/wizard/utils/mapAiParsed';
import { cn } from '@/lib/utils';

interface Props {
  parsed: ParsedListingData;
  categories: InternalCategory[];
  generatedTitle?: string;
}

interface PreviewRow {
  label: string;
  value: string | null;
}

function PreviewItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export function AIParserPreview({ parsed, categories, generatedTitle }: Props) {
  const categoryLabel = getCategoryLabel(categories, parsed.partCategory, parsed.partSubcategory);
  const confidencePct = Math.round(parsed.confidence * 100);

  const rows: PreviewRow[] = [
    { label: 'Kategoria', value: categoryLabel },
    { label: 'Tytuł', value: generatedTitle ?? null },
    { label: 'Stan', value: parsed.condition ? CONDITION_LABELS[parsed.condition] : null },
    { label: 'Strona', value: parsed.partSide },
    {
      label: 'Pojazd',
      value: [parsed.vehicleMake, parsed.vehicleModel, parsed.vehicleYear].filter(Boolean).join(' ') || null,
    },
    { label: 'Nr katalogowy', value: parsed.catalogNumber },
  ];

  const filledCount = rows.filter((row) => row.value).length;

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border p-4',
        parsed.needsReview ? 'border-amber-200 bg-amber-50/80' : 'border-green-200 bg-green-50/80',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {parsed.needsReview ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Wykryto {filledCount} {filledCount === 1 ? 'pole' : 'pól'}
            </p>
            <p className="text-xs text-gray-600">
              Tryb: {parsed.parserMode === 'AI' ? 'AI' : 'Regex (uproszczony)'} · pewność {confidencePct}%
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            parsed.parserMode === 'AI' ? 'bg-primary-100 text-primary-800' : 'bg-gray-200 text-gray-700',
          )}
        >
          <Sparkles className="h-3 w-3" />
          {parsed.parserMode}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <PreviewItem key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            confidencePct >= 60 ? 'bg-green-500' : 'bg-amber-500',
          )}
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {parsed.needsReview && (
        <p className="mt-3 text-xs text-amber-800">
          Niska pewność — sprawdź uzupełnione pola w formularzu poniżej.
        </p>
      )}
    </div>
  );
}
