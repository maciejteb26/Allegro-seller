import { SeoImportRow } from '@/api/imports.api';

function escapeCsv(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  if (/[",\n\r;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportImportRowsToCsv(rows: SeoImportRow[], fileName: string): void {
  const headers = [
    'wiersz',
    'ean',
    'tytul',
    'cena',
    'status_wyszukiwania',
    'status_seo',
    'tytul_seo',
    'status_publikacji',
    'komunikat',
    'url_allegro',
  ];

  const lines = [
    headers.join(';'),
    ...rows.map((row) =>
      [
        row.rowIndex,
        row.identifierRaw,
        row.draftTitle,
        row.price ?? '',
        row.enrichStatus,
        row.seoStatus,
        row.seo?.title ?? '',
        row.publishStatus ?? '',
        row.publishMessage ?? '',
        row.externalUrl ?? '',
      ]
        .map(escapeCsv)
        .join(';'),
    ),
  ];

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}-wynik.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
