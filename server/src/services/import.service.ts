import { IMPORT_PROFILE, ImportProfileId } from '../constants/import.constants';
import { AppError } from '../middleware/error.middleware';
import { ParsedImportRow } from '../types/import.types';
import { enrichImportRowsFull } from './import/import-enrich.service';
import { generateSeoForImportRows } from './import/import-seo.service';
import { detectImportProfile } from './import/detect-profile';
import { parseListaProduktowBuffer } from './import/lista-produktow.parser';
import { parseZestawienieBuffer } from './import/zestawienie.parser';
import { ClientSettingsContext } from '../types/client.types';
import { publishImportRows, ImportPublishResultRow } from './import/import-publish.service';
import { EnrichedImportRow, SeoImportRow } from '../types/import.types';

export function detectAndParseImportFile(buffer: Buffer, fileName: string): {
  profile: ImportProfileId;
  rows: ParsedImportRow[];
} {
  const profile = detectImportProfile(buffer, fileName);
  const rows = parseImportFile(profile, buffer, fileName);
  return { profile, rows };
}

export function parseImportFile(
  profile: ImportProfileId,
  buffer: Buffer,
  fileName: string,
): ParsedImportRow[] {
  switch (profile) {
    case IMPORT_PROFILE.ZESTAWIENIE:
      return parseZestawienieBuffer(buffer, fileName);
    case IMPORT_PROFILE.LISTA_PRODUKTOW:
      return parseListaProduktowBuffer(buffer, fileName);
    default:
      throw new AppError(400, `Nieznany profil importu: ${profile}`);
  }
}

export async function enrichParsedRows(
  userId: string,
  rows: ParsedImportRow[],
  client?: ClientSettingsContext | null,
  onProgress?: (done: number, total: number) => void,
): Promise<EnrichedImportRow[]> {
  return enrichImportRowsFull(userId, rows, client, onProgress);
}

export async function generateSeoForRows(
  rows: EnrichedImportRow[],
  client?: ClientSettingsContext | null,
  onProgress?: (done: number, total: number) => void,
): Promise<SeoImportRow[]> {
  return generateSeoForImportRows(rows, client, onProgress);
}

export async function publishRows(
  userId: string,
  rows: SeoImportRow[],
  client?: ClientSettingsContext | null,
): Promise<ImportPublishResultRow[]> {
  return publishImportRows(userId, rows, client ?? null);
}
