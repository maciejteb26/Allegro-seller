import { ListingStatus, Platform, PlatformStatus } from '@prisma/client';
import { DEFAULT_IMPORT_CATEGORY_SLUG } from '../../constants/external-search.constants';
import { sanitizeDescription } from '../../controllers/listing.controller';
import { AppError } from '../../middleware/error.middleware';
import { SeoImportRow } from '../../types/import.types';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import * as categoryService from '../category.service';
import * as imageService from '../image.service';
import * as listingService from '../listing.service';
import * as marginService from '../margin.service';
import * as titleGeneratorService from '../title-generator.service';
import { getPlatformService } from '../platforms';

export type ImportPublishStatus = 'published' | 'skipped' | 'error';

export interface ImportPublishResultRow extends SeoImportRow {
  publishStatus: ImportPublishStatus;
  publishMessage?: string;
  listingId?: string;
  externalUrl?: string;
}

export async function publishImportRows(
  userId: string,
  rows: SeoImportRow[],
): Promise<ImportPublishResultRow[]> {
  const categoryId = await resolveDefaultCategoryId();
  const results: ImportPublishResultRow[] = [];

  for (const row of rows) {
    results.push(await publishSingleRow(userId, row, categoryId));
  }

  return results;
}

async function publishSingleRow(
  userId: string,
  row: SeoImportRow,
  categoryId: string,
): Promise<ImportPublishResultRow> {
  if (!row.seo?.title || !row.seo.description) {
    return { ...row, publishStatus: 'skipped', publishMessage: 'Brak wygenerowanego SEO' };
  }
  if (row.price == null || row.price <= 0) {
    return { ...row, publishStatus: 'skipped', publishMessage: 'Brak ceny w Excelu' };
  }

  try {
    const listing = await listingService.createListing(userId, {
      title: row.seo.title,
      description: sanitizeDescription(row.seo.description),
      basePrice: row.price,
      condition: row.condition ?? 'NEW',
      quantity: row.quantity > 0 ? row.quantity : 1,
      identMethod: 'CATALOG_NUMBER',
      catalogNumber: row.identifierRaw || row.searchPhrase || undefined,
      vehicleType: 'OTHER',
      categoryId,
      rawUserInput: JSON.stringify({ importRowIndex: row.rowIndex, source: 'excel-import' }),
    });

    await attachImages(listing.id, row);
    const publishResult = await publishListingOnAllegro(userId, listing.id, row);

    return {
      ...row,
      publishStatus: 'published',
      publishMessage: 'Opublikowano na Allegro',
      listingId: listing.id,
      externalUrl: publishResult.externalUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd publikacji';
    logger.error('import_publish_row_failed', { userId, rowIndex: row.rowIndex, message });
    return { ...row, publishStatus: 'error', publishMessage: message };
  }
}

async function attachImages(listingId: string, row: SeoImportRow): Promise<void> {
  const urls = [
    ...new Set([
      ...(row.externalProduct?.imageUrls ?? []),
      row.allegroProduct?.imageUrl ?? '',
    ].filter(Boolean)),
  ].slice(0, 3);

  let uploaded = 0;
  for (const [index, url] of urls.entries()) {
    const result = await imageService.uploadImageFromUrl(url, listingId, index, index === 0);
    if (result) uploaded += 1;
  }

  if (uploaded === 0) {
    await imageService.uploadPlaceholderImage(listingId);
  }
}

async function publishListingOnAllegro(
  userId: string,
  listingId: string,
  row: SeoImportRow,
): Promise<{ externalUrl?: string }> {
  const platform: Platform = 'ALLEGRO';
  const active = await prisma.userPlatform.findFirst({
    where: { userId, platform, isActive: true },
  });
  if (!active) throw new AppError(400, 'Połącz konto Allegro w ustawieniach platform');

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId },
    include: { category: true, images: true },
  });
  if (!listing || listing.images.length === 0) {
    throw new AppError(400, 'Brak zdjęć do publikacji');
  }

  const marginRules = await marginService.getMarginRules(userId);
  const rule = marginRules.find((item) => item.platform === platform);
  const finalPrice = marginService.calculateFinalPrice(Number(listing.basePrice), rule ?? null);
  const platformTitle = await titleGeneratorService.generateTitle(listing, platform);

  await prisma.platformListing.upsert({
    where: { listingId_platform: { listingId, platform } },
    create: { listingId, platform, finalPrice, platformTitle, status: PlatformStatus.PENDING },
    update: { finalPrice, platformTitle, status: PlatformStatus.PENDING, errorMessage: null },
  });

  await prisma.listing.update({ where: { id: listingId }, data: { status: ListingStatus.PUBLISHING } });

  try {
    const categoryId = row.allegroProduct?.categoryId
      || await categoryService.resolveExternalCategoryId(userId, listing.categoryId, platform, listing.title);

    const service = getPlatformService(platform);
    const result = await service.publishListing(listing, categoryId, row.allegroProduct?.id);

    await prisma.platformListing.update({
      where: { listingId_platform: { listingId, platform } },
      data: {
        externalId: result.externalId,
        externalUrl: result.externalUrl,
        status: PlatformStatus.ACTIVE,
        publishedAt: new Date(),
      },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: ListingStatus.ACTIVE } });

    return { externalUrl: result.externalUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd publikacji';
    await prisma.platformListing.update({
      where: { listingId_platform: { listingId, platform } },
      data: { status: PlatformStatus.ERROR, errorMessage: message },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { status: ListingStatus.ERROR } });
    throw error;
  }
}

async function resolveDefaultCategoryId(): Promise<string> {
  const category = await prisma.internalCategory.findUnique({
    where: { slug: DEFAULT_IMPORT_CATEGORY_SLUG },
    select: { id: true },
  });
  if (!category) throw new AppError(500, 'Brak domyślnej kategorii importu w bazie');
  return category.id;
}
