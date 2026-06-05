import { IMPORT_PROFILE, ImportProfileId, LISTA_PRODUKTOW_COLUMNS, ZESTAWIENIE_COLUMNS } from '../../constants/import.constants';
import { readSpreadsheetBuffer, rowsToObjects } from './excel-reader';

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function detectImportProfile(buffer: Buffer, fileName: string): ImportProfileId {
  const matrix = readSpreadsheetBuffer(buffer, fileName);
  if (matrix.length === 0) return IMPORT_PROFILE.ZESTAWIENIE;

  const headers = (matrix[0] ?? []).map((h) => normalizeHeader(String(h)));
  const headerSet = new Set(headers);

  const listaKeys = [
    LISTA_PRODUKTOW_COLUMNS.NAME,
    LISTA_PRODUKTOW_COLUMNS.EAN,
    LISTA_PRODUKTOW_COLUMNS.SKU,
  ].map(normalizeHeader);

  if (listaKeys.every((key) => headerSet.has(key))) {
    return IMPORT_PROFILE.LISTA_PRODUKTOW;
  }

  const zestawienieKeys = [ZESTAWIENIE_COLUMNS.EAN, ZESTAWIENIE_COLUMNS.TITLE].map(normalizeHeader);
  if (zestawienieKeys.every((key) => headerSet.has(key))) {
    return IMPORT_PROFILE.ZESTAWIENIE;
  }

  const records = rowsToObjects(matrix);
  const first = records[0] ?? {};
  if (getAny(first, ['produkt_nazwa', 'produkt_ean'])) return IMPORT_PROFILE.LISTA_PRODUKTOW;
  if (getAny(first, ['EAN', 'Tytuł', 'Sygnatura'])) return IMPORT_PROFILE.ZESTAWIENIE;

  return IMPORT_PROFILE.ZESTAWIENIE;
}

function getAny(record: Record<string, string>, keys: string[]): boolean {
  const normalized = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [normalizeHeader(k), v]),
  );
  return keys.some((key) => !!normalized[normalizeHeader(key)]);
}
