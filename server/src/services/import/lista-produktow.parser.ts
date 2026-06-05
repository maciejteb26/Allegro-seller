import { LISTA_PRODUKTOW_COLUMNS } from '../../constants/import.constants';
import { ParsedImportRow } from '../../types/import.types';
import { isEmptyImportRow, resolveIdentifier } from './identifier.utils';
import { readSpreadsheetBuffer, rowsToObjects } from './excel-reader';

function parsePrice(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseQuantity(raw: string): number {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function getField(record: Record<string, string>, key: string): string {
  const direct = record[key] ?? record[key.trim()];
  if (direct) return direct;
  const lowerKey = key.toLowerCase();
  const match = Object.entries(record).find(([k]) => k.trim().toLowerCase() === lowerKey);
  return match?.[1] ?? '';
}

export function parseListaProduktowBuffer(buffer: Buffer, fileName: string): ParsedImportRow[] {
  const matrix = readSpreadsheetBuffer(buffer, fileName);
  const records = rowsToObjects(matrix);
  const rows: ParsedImportRow[] = [];

  records.forEach((record, index) => {
    const identifierRaw = getField(record, LISTA_PRODUKTOW_COLUMNS.EAN);
    const draftTitle = getField(record, LISTA_PRODUKTOW_COLUMNS.NAME);
    const price = parsePrice(getField(record, LISTA_PRODUKTOW_COLUMNS.PRICE));
    const sku = getField(record, LISTA_PRODUKTOW_COLUMNS.SKU);

    if (isEmptyImportRow({ identifierRaw, signature: sku, draftTitle, price })) return;

    const { identifierType, searchPhrase } = resolveIdentifier(identifierRaw, draftTitle);
    const category = getField(record, LISTA_PRODUKTOW_COLUMNS.CATEGORY);
    const producer = getField(record, LISTA_PRODUKTOW_COLUMNS.PRODUCER);

    rows.push({
      rowIndex: index + 2,
      sourceLink: '',
      identifierRaw,
      identifierType,
      searchPhrase,
      signature: sku,
      condition: 'NEW',
      quantity: parseQuantity(getField(record, LISTA_PRODUKTOW_COLUMNS.QUANTITY)),
      packaging: '',
      price,
      delivery: '',
      draftTitle,
      notes: [category, producer].filter(Boolean).join(' · '),
    });
  });

  return rows;
}
