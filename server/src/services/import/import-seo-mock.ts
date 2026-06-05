import { CLIENT_VAT_LABELS } from '../../constants/client.constants';
import { IMPORT_CONDITION_LABELS } from '../../constants/import-seo.constants';
import { ClientSettingsContext } from '../../types/client.types';
import { EnrichedImportRow, ImportSeoContent } from '../../types/import.types';
import { buildKeywordTitle, fitTitleToLimit } from './import-seo.utils';

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.length <= 2 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function extractKeywords(draft: string): string[] {
  const stopWords = new Set(['do', 'na', 'i', 'z', 'w', 'dla', 'oraz', 'the', 'and']);
  return draft
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 6);
}

export function generateMockSeo(row: EnrichedImportRow, client?: ClientSettingsContext | null): ImportSeoContent {
  const productName = row.allegroProduct?.name || row.externalProduct?.title || row.draftTitle;
  const conditionLabel = row.condition ? IMPORT_CONDITION_LABELS[row.condition] : null;
  const keywords = extractKeywords(row.draftTitle);

  const title = fitTitleToLimit(
    buildKeywordTitle([
      row.allegroProduct?.name ? toTitleCase(row.allegroProduct.name) : toTitleCase(row.draftTitle),
      conditionLabel,
      keywords[0] !== row.draftTitle.toLowerCase().split(' ')[0] ? keywords[0] : null,
    ]),
  );

  const ean = row.allegroProduct?.gtin || (row.identifierType === 'GTIN' ? row.searchPhrase : null);

  const paragraphs = [
    `${toTitleCase(productName)} — produkt gotowy do wysyłki. ${row.externalProduct ? `Na podstawie oferty ${row.externalProduct.sourceName} (przetłumaczone na polski). ` : ''}${row.allegroProduct?.categoryName ? `Kategoria: ${row.allegroProduct.categoryName}.` : ''} Idealny wybór dla kupujących szukających sprawdzonego sprzedawcy na Allegro.`,
    [
      conditionLabel ? `Stan: ${conditionLabel}.` : null,
      ean ? `Kod EAN: ${ean}.` : null,
      row.packaging ? `Opakowanie: ${row.packaging}.` : null,
      row.quantity > 1 ? `Dostępna ilość: ${row.quantity} szt.` : null,
      client ? `VAT: ${CLIENT_VAT_LABELS[client.vatRate as keyof typeof CLIENT_VAT_LABELS] ?? client.vatRate}.` : null,
      client ? `Faktura VAT: ${client.issuesInvoices ? 'tak' : 'nie'}.` : null,
    ].filter(Boolean).join(' '),
    [
      row.delivery ? `Wysyłka: ${row.delivery}.` : 'Realizacja zamówienia w możliwie najkrótszym czasie.',
      'Każda przesyłka jest starannie zabezpieczona przed uszkodzeniem w transporcie.',
    ].join(' '),
    'Zapraszamy do zakupu. Oferta przygotowana z myślą o widoczności w wyszukiwarce Allegro — przejrzysty tytuł, kompletny opis i zgodność z katalogiem produktów.',
  ];

  return {
    title,
    description: paragraphs.join('\n\n'),
    titleLength: title.length,
    mode: 'AI',
  };
}
