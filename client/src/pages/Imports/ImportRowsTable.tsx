import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SeoImportRow, ImportEnrichStatus } from '@/api/imports.api';
import { cn } from '@/lib/utils';
import { ImportSeoPreview } from './ImportSeoPreview';

const STATUS_LABELS: Record<ImportEnrichStatus, string> = {
  pending: 'Oczekuje',
  matched: 'W katalogu',
  not_found: 'Brak w katalogu',
  skipped: 'Pominięto',
  error: 'Błąd',
};

const STATUS_CLASSES: Record<ImportEnrichStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  matched: 'bg-green-100 text-green-800',
  not_found: 'bg-amber-100 text-amber-800',
  skipped: 'bg-gray-100 text-gray-500',
  error: 'bg-red-100 text-red-800',
};

interface ImportRowsTableProps {
  rows: SeoImportRow[];
}

export function ImportRowsTable({ rows }: ImportRowsTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2 w-8" />
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Sygnatura</th>
            <th className="px-3 py-2">Identyfikator</th>
            <th className="px-3 py-2">Tytuł SEO</th>
            <th className="px-3 py-2">Cena</th>
            <th className="px-3 py-2">Źródło</th>
            <th className="px-3 py-2">Allegro</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedRow === row.rowIndex;
            const hasSeo = !!row.seo;

            return (
              <Fragment key={row.rowIndex}>
                <tr
                  className={cn('border-t border-gray-100 hover:bg-gray-50', hasSeo && 'cursor-pointer')}
                  onClick={() => hasSeo && setExpandedRow(isExpanded ? null : row.rowIndex)}
                >
                  <td className="px-3 py-2 text-gray-400">
                    {hasSeo && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.rowIndex}</td>
                  <td className="px-3 py-2 font-medium">{row.signature || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs">{row.identifierRaw || row.searchPhrase}</div>
                    <div className="text-xs text-gray-400">{row.identifierType}</div>
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    {row.seo ? (
                      <div>
                        <div className="truncate font-medium" title={row.seo.title}>{row.seo.title}</div>
                        <div className="text-xs text-gray-400">{row.seo.titleLength}/75 · {row.seo.mode}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 truncate block" title={row.draftTitle}>{row.draftTitle || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.price != null ? `${row.price.toFixed(2)} PLN` : '—'}
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    {row.externalProduct ? (
                      <div>
                        <div className="truncate font-medium" title={row.externalProduct.sourceName}>
                          {row.externalProduct.sourceName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {row.externalProduct.language && row.externalProduct.language !== 'pl'
                            ? `${row.externalProduct.language.toUpperCase()} → PL`
                            : 'PL'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    {row.allegroProduct ? (
                      <div>
                        <div className="truncate font-medium" title={row.allegroProduct.name}>
                          {row.allegroProduct.name}
                        </div>
                        <div className="text-xs text-gray-400">{row.allegroProduct.categoryName}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_CLASSES[row.enrichStatus ?? 'pending'],
                      )}
                      title={row.enrichMessage || row.publishMessage}
                    >
                      {row.publishStatus === 'published'
                        ? 'Wystawione'
                        : row.publishStatus === 'error'
                          ? 'Błąd publikacji'
                          : STATUS_LABELS[row.enrichStatus ?? 'pending']}
                    </span>
                  </td>
                </tr>
                {isExpanded && hasSeo && (
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td colSpan={9} className="px-6 py-4">
                      <ImportSeoPreview row={row} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
