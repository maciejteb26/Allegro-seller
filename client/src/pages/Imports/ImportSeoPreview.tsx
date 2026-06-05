import { SeoImportRow } from '@/api/imports.api';
import { AlertTriangle } from 'lucide-react';

const TITLE_LIMIT = 75;

interface ImportSeoPreviewProps {
  row: SeoImportRow;
}

export function ImportSeoPreview({ row }: ImportSeoPreviewProps) {
  if (!row.seo) return null;

  const overLimit = row.seo.titleLength >= TITLE_LIMIT;

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Tytuł SEO ({row.seo.mode})</span>
          <span className="flex items-center gap-1">
            {row.seo.titleLength}/{TITLE_LIMIT}
            {overLimit && <AlertTriangle className="h-3 w-3 text-amber-500" />}
          </span>
        </div>
        <p className="font-medium text-gray-900">{row.seo.title}</p>
      </div>
      <div>
        <div className="mb-1 text-xs text-gray-500">Opis SEO</div>
        <p className="whitespace-pre-wrap text-gray-700">{row.seo.description}</p>
      </div>
      {row.externalProduct && (
        <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
          <div className="font-medium">Źródło: {row.externalProduct.sourceName}</div>
          <div className="mt-1 text-blue-800">{row.externalProduct.title}</div>
          {row.externalProduct.language && row.externalProduct.language !== 'pl' && (
            <div className="mt-1">Oryginał ({row.externalProduct.language}) przetłumaczony na polski przez AI.</div>
          )}
        </div>
      )}
      {row.publishStatus === 'published' && row.externalUrl && (
        <a href={row.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-green-700 underline">
          Zobacz ofertę na Allegro
        </a>
      )}
      {row.seoMessage && <p className="text-xs text-amber-700">{row.seoMessage}</p>}
      {row.publishMessage && row.publishStatus !== 'published' && (
        <p className="text-xs text-red-700">{row.publishMessage}</p>
      )}
    </div>
  );
}
