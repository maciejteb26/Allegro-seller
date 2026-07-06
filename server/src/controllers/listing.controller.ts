import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { AuthRequest } from '../middleware/auth.middleware';
import * as listingService from '../services/listing.service';
import type { CreateListingData } from '../services/listing.service';
import * as imageService from '../services/image.service';
import { ListingStatus, Platform, PlatformStatus } from '@prisma/client';
import { syncAllegroOfferStats } from '../services/allegro-stats.service';
import * as titleGeneratorService from '../services/title-generator.service';
import * as marginService from '../services/margin.service';
import { getPlatformService } from '../services/platforms';
import * as categoryService from '../services/category.service';
import { logPublishAttempt } from '../services/publish-log.service';
import { prisma } from '../utils/prisma';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  productBrand: z.string().max(80).nullish(),
  basePrice: z.number().positive(),
  condition: z.enum(['NEW', 'USED', 'DAMAGED']),
  quantity: z.number().int().positive().optional(),
  identMethod: z.enum(['VIN', 'CATALOG_NUMBER', 'MANUAL', 'AI_PARSED']),
  vin: z.string().nullish(),
  catalogNumber: z.string().nullish(),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'OTHER']),
  vehicleMakeId: z.string().nullish(),
  vehicleModelId: z.string().nullish(),
  vehicleGenId: z.string().nullish(),
  vehicleYearRaw: z.number().int().nullish(),
  vehicleEngine: z.string().nullish(),
  categoryId: z.string().min(1),
  partSide: z.string().nullish(),
  partDetails: z.string().nullish(),
  damageDescription: z.string().nullish(),
  rawUserInput: z.string().nullish(),
});

const filterSchema = z.object({
  status: z.nativeEnum(ListingStatus).optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const publishSchema = z.object({
  platforms: z.array(z.enum(['ALLEGRO'])).min(1),
});

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

/** Zod nullish() dopuszcza null — Prisma/service oczekują undefined zamiast null. */
function stripNulls<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null),
  ) as Partial<T>;
}

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
  allowedAttributes: {},
};

export function sanitizeDescription(value: string): string {
  return sanitizeHtml(value, SANITIZE_OPTS);
}

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const data = stripNulls(createSchema.parse(req.body));
    if (data.description) data.description = sanitizeDescription(data.description);
    const listing = await listingService.createListing(userId(req), data as CreateListingData);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

export async function getListings(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = filterSchema.parse(req.query);
    const result = await listingService.getListings(userId(req), filter);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.getListing(userId(req), req.params.id);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const data = stripNulls(createSchema.partial().parse(req.body));
    if (data.description) data.description = sanitizeDescription(data.description);
    const listing = await listingService.updateListing(
      userId(req),
      req.params.id,
      data as Partial<CreateListingData>,
    );
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    await listingService.deleteListing(userId(req), req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function duplicateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.duplicateListing(userId(req), req.params.id);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const listing = await listingService.getListing(userId(req), req.params.id);
    const existingCount = listing.images.length;

    const uploaded = await Promise.all(
      files.map((file, i) =>
        imageService.uploadImage(
          file.buffer,
          req.params.id,
          existingCount + i,
          existingCount === 0 && i === 0,
        ),
      ),
    );

    res.status(201).json({ uploaded: uploaded.length });
  } catch (err) {
    next(err);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    await imageService.deleteImage(req.params.imageId, userId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getListingTitles(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, userId: userId(req) },
      include: { category: true },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    const titles = await titleGeneratorService.generateTitleForAllPlatforms(listing);
    res.json({ titles, limits: titleGeneratorService.getTitleLimits() });
  } catch (err) {
    next(err);
  }
}

export async function publishListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { platforms } = publishSchema.parse(req.body);
    const uid = userId(req);
    const listing = await listingService.getListing(uid, req.params.id);
    if (!listing.title || !listing.categoryId || listing.images.length === 0) {
      res.status(400).json({ error: 'Listing must have title, category and images' });
      return;
    }

    const activePlatforms = await prisma.userPlatform.findMany({
      where: { userId: uid, platform: { in: platforms as Platform[] }, isActive: true },
      select: { platform: true },
    });
    const activeSet = new Set(activePlatforms.map((item) => item.platform));
    const disconnected = platforms.filter((platform) => !activeSet.has(platform as Platform));
    if (disconnected.length > 0) {
      res.status(400).json({ error: `Disconnected platforms: ${disconnected.join(', ')}` });
      return;
    }

    const marginRules = await marginService.getMarginRules(uid);
    const results: Record<string, string> = {};

    await prisma.listing.update({ where: { id: listing.id }, data: { status: ListingStatus.PUBLISHING } });

    for (const platform of platforms) {
      const rule = marginRules.find((item) => item.platform === platform);
      const finalPrice = marginService.calculateFinalPrice(Number(listing.basePrice), rule ?? null);
      const platformTitle = await titleGeneratorService.generateTitle(listing, platform as Platform);

      await prisma.platformListing.upsert({
        where: { listingId_platform: { listingId: listing.id, platform: platform as Platform } },
        create: { listingId: listing.id, platform: platform as Platform, finalPrice, platformTitle, status: PlatformStatus.PENDING },
        update: { finalPrice, platformTitle, status: PlatformStatus.PENDING, errorMessage: null },
      });

      try {
        const categoryId = await categoryService.resolveExternalCategoryId(
          uid,
          listing.categoryId,
          platform as Platform,
          listing.title,
        );
        const dbListing = await prisma.listing.findUnique({
          where: { id: listing.id },
          include: { category: true, images: true },
        });
        const service = getPlatformService(platform as Platform);
        const result = await service.publishListing(dbListing!, categoryId);

        await prisma.platformListing.update({
          where: { listingId_platform: { listingId: listing.id, platform: platform as Platform } },
          data: { externalId: result.externalId, externalUrl: result.externalUrl, status: PlatformStatus.ACTIVE, publishedAt: new Date() },
        });
        results[platform] = 'ACTIVE';
        await logPublishAttempt({ userId: uid, platform: platform as Platform, status: 'SUCCESS', listingId: listing.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await prisma.platformListing.update({
          where: { listingId_platform: { listingId: listing.id, platform: platform as Platform } },
          data: { status: PlatformStatus.ERROR, errorMessage: message },
        });
        results[platform] = 'ERROR';
        await logPublishAttempt({ userId: uid, platform: platform as Platform, status: 'ERROR', listingId: listing.id, message });
      }
    }

    const allActive = Object.values(results).every((s) => s === 'ACTIVE');
    const anyActive = Object.values(results).some((s) => s === 'ACTIVE');
    const nextStatus = allActive ? ListingStatus.ACTIVE : anyActive ? ListingStatus.PARTIALLY_ACTIVE : ListingStatus.ERROR;
    await prisma.listing.update({ where: { id: listing.id }, data: { status: nextStatus } });

    res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
}

export async function getPublishStatus(req: Request, res: Response, next: NextFunction) {
  try {
    await listingService.getListing(userId(req), req.params.id);
    const statuses = await prisma.platformListing.findMany({
      where: { listingId: req.params.id },
      select: { platform: true, status: true },
    });
    res.json(Object.fromEntries(statuses.map((item) => [item.platform, item.status])));
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const uid = userId(req);

    try {
      await syncAllegroOfferStats(uid);
    } catch {
      // Statystyki Allegro są opcjonalne — dashboard działa bez nich
    }

    const [totalListings, activeListings, draftListings, recentListings, byPlatform, allegroTotals] =
      await Promise.all([
      prisma.listing.count({ where: { userId: uid } }),
      prisma.listing.count({ where: { userId: uid, status: ListingStatus.ACTIVE } }),
      prisma.listing.count({ where: { userId: uid, status: ListingStatus.DRAFT } }),
      prisma.listing.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.platformListing.groupBy({
        by: ['platform'],
        where: { listing: { userId: uid }, status: PlatformStatus.ACTIVE },
        _count: { _all: true },
      }),
      prisma.platformListing.aggregate({
        where: { listing: { userId: uid }, platform: Platform.ALLEGRO, status: PlatformStatus.ACTIVE },
        _sum: { visitsCount: true, watchersCount: true, soldCount: true },
      }),
    ]);

    res.json({
      totalListings,
      activeListings,
      draftListings,
      listingsByPlatform: byPlatform.map((item) => ({ platform: item.platform, active: item._count._all })),
      recentListings,
      allegro: {
        visitsCount: allegroTotals._sum.visitsCount ?? 0,
        watchersCount: allegroTotals._sum.watchersCount ?? 0,
        soldCount: allegroTotals._sum.soldCount ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
