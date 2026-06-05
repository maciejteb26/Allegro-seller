import { ZESTAWIENIE_COLUMNS } from '../../constants/import.constants';
import { ImportCondition, ParsedImportRow } from '../../types/import.types';
import { isEmptyImportRow, resolveIdentifier } from './identifier.utils';
import { readSpreadsheetBuffer, rowsToObjects } from './excel-reader';

const CONDITION_MAP: Record<string, ImportCondition> = {
  NOWY: 'NEW',
  UŻYWANY: 'USED',
  UZYWANY: 'USED',
  USZKODZONY: 'DAMAGED',
};

function parseCondition(raw: string): ImportCondition | null {
  const key = raw.trim().toUpperCase();
  return CONDITION_MAP[key] ?? null;
}

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
  return record[key] ?? record[key.trim()] ?? '';
}

export function parseZestawienieBuffer(buffer: Buffer, fileName: string): ParsedImportRow[] {
  const matrix = readSpreadsheetBuffer(buffer, fileName);
  const records = rowsToObjects(matrix);
  const rows: ParsedImportRow[] = [];

  records.forEach((record, index) => {
    const identifierRaw = getField(record, ZESTAWIENIE_COLUMNS.EAN);
    const draftTitle = getField(record, ZESTAWIENIE_COLUMNS.TITLE);
    const price = parsePrice(getField(record, ZESTAWIENIE_COLUMNS.PRICE));

    if (isEmptyImportRow({ identifierRaw, signature: getField(record, ZESTAWIENIE_COLUMNS.SIGNATURE), draftTitle, price })) {
      return;
    }

    const { identifierType, searchPhrase } = resolveIdentifier(identifierRaw, draftTitle);

    rows.push({
      rowIndex: index + 2,
      sourceLink: getField(record, ZESTAWIENIE_COLUMNS.SOURCE_LINK),
      identifierRaw,
      identifierType,
      searchPhrase,
      signature: getField(record, ZESTAWIENIE_COLUMNS.SIGNATURE),
      condition: parseCondition(getField(record, ZESTAWIENIE_COLUMNS.CONDITION)),
      quantity: parseQuantity(getField(record, ZESTAWIENIE_COLUMNS.QUANTITY)),
      packaging: getField(record, ZESTAWIENIE_COLUMNS.PACKAGING),
      price,
      delivery: getField(record, ZESTAWIENIE_COLUMNS.DELIVERY),
      draftTitle,
      notes: getField(record, ZESTAWIENIE_COLUMNS.NOTES),
    });
  });

  return rows;
}
