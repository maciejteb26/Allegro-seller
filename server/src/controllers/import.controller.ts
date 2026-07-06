import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { IMPORT_PROFILE } from '../constants/import.constants';
import * as clientService from '../services/client.service';
import * as importService from '../services/import.service';
import { toClientSettingsContext } from '../utils/client-context';
import { enrichImportSchema, publishImportSchema, seoImportSchema } from '../validators/import.validator';

async function resolveClientContext(userId: string, clientId?: string) {
  const id = clientId ?? (await clientService.getActiveClient(userId))?.id;
  if (!id) return null;
  const client = await clientService.getClientForUser(userId, id);
  return toClientSettingsContext(client);
}

export async function parseImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, 'Brak pliku do importu');

    const userId = (req as AuthRequest).userId;
    const clientId = req.body.clientId ? String(req.body.clientId) : undefined;
    const client = await resolveClientContext(userId, clientId);

    const detected = importService.detectAndParseImportFile(req.file.buffer, req.file.originalname);
    const preferredProfile = client?.importProfile && client.importProfile !== 'auto' ? client.importProfile : null;
    const requestedProfile = req.body.profile ? String(req.body.profile) : preferredProfile;

    const profile = requestedProfile && Object.values(IMPORT_PROFILE).includes(requestedProfile as typeof IMPORT_PROFILE[keyof typeof IMPORT_PROFILE])
      ? (requestedProfile as typeof IMPORT_PROFILE[keyof typeof IMPORT_PROFILE])
      : detected.profile;

    const rows = profile !== detected.profile
      ? importService.parseImportFile(profile, req.file.buffer, req.file.originalname)
      : detected.rows;

    if (rows.length === 0) {
      throw new AppError(
        400,
        'Nie znaleziono pozycji w pliku. Obsługiwane formaty: „Zestawienie” (EAN, Tytuł) lub „Lista produktów” (produkt_nazwa, produkt_ean).',
      );
    }

    res.json({
      profile,
      profileLabel: profile === IMPORT_PROFILE.LISTA_PRODUKTOW ? 'Lista produktów' : 'Zestawienie',
      fileName: req.file.originalname,
      totalRows: rows.length,
      rows,
      client,
    });
  } catch (error) {
    next(error);
  }
}

// Strumień NDJSON (jedna linia JSON na zdarzenie): { type: 'progress', done, total }
// zakończony { type: 'done', ...wynik }. Import może mieć realne wywołania API (SerpAPI,
// Anthropic, Allegro) per wiersz, więc jedna zbiorcza odpowiedź na końcu daje zero feedbacku.
function startProgressStream(res: Response) {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  return {
    progress: (done: number, total: number) => res.write(`${JSON.stringify({ type: 'progress', done, total })}\n`),
    done: (payload: Record<string, unknown>) => res.end(`${JSON.stringify({ type: 'done', ...payload })}\n`),
  };
}

export async function enrichImport(req: Request, res: Response, next: NextFunction) {
  const stream = startProgressStream(res);
  try {
    const userId = (req as AuthRequest).userId;
    const body = enrichImportSchema.parse(req.body);
    const client = await resolveClientContext(userId, body.clientId);
    const enriched = await importService.enrichParsedRows(userId, body.rows, client, stream.progress);

    const matched = enriched.filter((row) => row.enrichStatus === 'matched').length;
    const notFound = enriched.filter((row) => row.enrichStatus === 'not_found').length;
    const errors = enriched.filter((row) => row.enrichStatus === 'error').length;

    stream.done({ rows: enriched, summary: { matched, notFound, errors, total: enriched.length } });
  } catch (error) {
    next(error);
  }
}

export async function generateSeo(req: Request, res: Response, next: NextFunction) {
  const stream = startProgressStream(res);
  try {
    const userId = (req as AuthRequest).userId;
    const body = seoImportSchema.parse(req.body);
    const client = await resolveClientContext(userId, body.clientId);
    const rows = await importService.generateSeoForRows(
      body.rows.map((row) => ({
        ...row,
        enrichStatus: row.enrichStatus ?? 'pending',
        allegroProduct: row.allegroProduct ?? null,
        externalProduct: row.externalProduct ?? null,
      })),
      client,
      stream.progress,
    );

    const generated = rows.filter((row) => row.seoStatus === 'generated').length;
    const skipped = rows.filter((row) => row.seoStatus === 'skipped').length;
    const errors = rows.filter((row) => row.seoStatus === 'error').length;
    const aiCount = rows.filter((row) => row.seo?.mode === 'AI').length;

    stream.done({
      rows,
      summary: { generated, skipped, errors, aiCount, total: rows.length },
      client,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishImport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthRequest).userId;
    const body = publishImportSchema.parse(req.body);
    const client = await resolveClientContext(userId, body.clientId);
    const rows = await importService.publishRows(
      userId,
      body.rows.map((row) => ({
        ...row,
        enrichStatus: row.enrichStatus ?? 'pending',
        allegroProduct: row.allegroProduct ?? null,
        externalProduct: row.externalProduct ?? null,
        seo: row.seo ?? null,
        seoStatus: row.seoStatus ?? 'pending',
      })),
      client,
    );

    const published = rows.filter((row) => row.publishStatus === 'published').length;
    const skipped = rows.filter((row) => row.publishStatus === 'skipped').length;
    const errors = rows.filter((row) => row.publishStatus === 'error').length;

    res.json({
      rows,
      summary: { published, skipped, errors, total: rows.length },
    });
  } catch (error) {
    next(error);
  }
}
