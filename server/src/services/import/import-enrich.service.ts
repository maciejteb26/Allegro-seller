import {
  ENRICH_BATCH_DELAY_MS,
  ENRICH_BATCH_SIZE,
} from '../../constants/import.constants';
import { ClientSettingsContext } from '../../types/client.types';
import { ParsedImportRow } from '../../types/import.types';
import { searchAllegroCatalog } from '../allegro-catalog.service';
import { searchExternalProduct } from '../external-search/external-search.service';
import { EnrichedImportRow } from '../../types/import.types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichImportRowsFull(
  userId: string,
  rows: ParsedImportRow[],
  client?: ClientSettingsContext | null,
  onProgress?: (done: number, total: number) => void,
): Promise<EnrichedImportRow[]> {
  const results: EnrichedImportRow[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    results.push(await enrichSingleRow(userId, row, client));
    onProgress?.(index + 1, rows.length);

    if ((index + 1) % ENRICH_BATCH_SIZE === 0 && index + 1 < rows.length) {
      await delay(ENRICH_BATCH_DELAY_MS);
    }
  }

  return results;
}

async function enrichSingleRow(
  userId: string,
  row: ParsedImportRow,
  client?: ClientSettingsContext | null,
): Promise<EnrichedImportRow> {
  if (!row.searchPhrase.trim() && !row.draftTitle.trim() && !row.sourceLink.trim()) {
    return {
      ...row,
      allegroProduct: null,
      externalProduct: null,
      enrichStatus: 'skipped',
      enrichMessage: 'Brak danych do wyszukania produktu',
    };
  }

  try {
    const [externalProduct, allegroProduct] = await Promise.all([
      searchExternalProduct(row, { allowedSellerDomains: client?.sellerDomains }),
      row.searchPhrase.trim()
        ? searchAllegroCatalog(userId, row.searchPhrase, row.identifierType)
        : Promise.resolve(null),
    ]);

    const hasMatch = Boolean(externalProduct || allegroProduct);
    const messages: string[] = [];
    if (externalProduct) messages.push(`Źródło: ${externalProduct.sourceName}`);
    if (allegroProduct) messages.push('Katalog Allegro');
    if (!hasMatch) messages.push('Nie znaleziono w Google ani w katalogu Allegro');

    return {
      ...row,
      externalProduct,
      allegroProduct,
      enrichStatus: hasMatch ? 'matched' : 'not_found',
      enrichMessage: messages.join(' · '),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd wyszukiwania produktu';
    return {
      ...row,
      allegroProduct: null,
      externalProduct: null,
      enrichStatus: 'error',
      enrichMessage: message,
    };
  }
}
