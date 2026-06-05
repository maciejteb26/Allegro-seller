import { Prisma, ListingStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { enrichImagesWithUrls } from './image.service';

const LISTING_WITH_RELATIONS = {
  images: { orderBy: { order: 'asc' as const } },
  platformListings: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ListingInclude;

export interface CreateListingData {
  title: string;
  description: string;
  basePrice: number;
  condition: 'NEW' | 'USED' | 'DAMAGED';
  quantity?: number;
  identMethod: 'VIN' | 'CATALOG_NUMBER' | 'MANUAL' | 'AI_PARSED';
  vin?: string;
  catalogNumber?: string;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'OTHER';
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleGenId?: string;
  vehicleYearRaw?: number;
  vehicleEngine?: string;
  categoryId: string;
  partSide?: string;
  partDetails?: string;
  damageDescription?: string;
  rawUserInput?: string;
}

export async function createListing(userId: string, data: CreateListingData) {
  const listing = await prisma.listing.create({
    data: {
      userId,
      ...data,
      basePrice: new Prisma.Decimal(data.basePrice),
      status: ListingStatus.DRAFT,
    },
    include: LISTING_WITH_RELATIONS,
  });

  return enrichListing(listing);
}

export async function getListing(userId: string, listingId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId },
    include: LISTING_WITH_RELATIONS,
  });
  if (!listing) throw new AppError(404, 'Listing not found');
  return enrichListing(listing);
}

export interface ListingsFilter {
  status?: ListingStatus;
  search?: string;
  cursor?: string;
  limit?: number;
}

export async function getListings(userId: string, filter: ListingsFilter = {}) {
  const limit = Math.min(filter.limit ?? 20, 100);

  const where: Prisma.ListingWhereInput = {
    userId,
    ...(filter.status && { status: filter.status }),
    ...(filter.search && {
      OR: [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ],
    }),
  };

  const listings = await prisma.listing.findMany({
    where,
    include: LISTING_WITH_RELATIONS,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
  });

  const hasMore = listings.length > limit;
  const items = hasMore ? listings.slice(0, limit) : listings;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const enriched = await Promise.all(items.map(enrichListing));
  return { items: enriched, nextCursor, hasMore };
}

export async function updateListing(
  userId: string,
  listingId: string,
  data: Partial<CreateListingData>,
) {
  const existing = await prisma.listing.findFirst({ where: { id: listingId, userId } });
  if (!existing) throw new AppError(404, 'Listing not found');

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...data,
      ...(data.basePrice !== undefined && {
        basePrice: new Prisma.Decimal(data.basePrice),
      }),
    },
    include: LISTING_WITH_RELATIONS,
  });

  return enrichListing(updated);
}

export async function deleteListing(userId: string, listingId: string): Promise<void> {
  const existing = await prisma.listing.findFirst({ where: { id: listingId, userId } });
  if (!existing) throw new AppError(404, 'Listing not found');
  await prisma.listing.delete({ where: { id: listingId } });
}

export async function duplicateListing(userId: string, listingId: string) {
  const original = await prisma.listing.findFirst({
    where: { id: listingId, userId },
    include: { images: true },
  });
  if (!original) throw new AppError(404, 'Listing not found');

  const { id, createdAt, updatedAt, status, ...rest } = original;

  const duplicate = await prisma.listing.create({
    data: {
      ...rest,
      title: `${original.title} (kopia)`,
      status: ListingStatus.DRAFT,
      images: {
        create: original.images.map(({ id: _id, listingId: _lid, ...img }) => img),
      },
    },
    include: LISTING_WITH_RELATIONS,
  });

  return enrichListing(duplicate);
}

async function enrichListing<T extends { images: { s3Key: string }[] }>(listing: T) {
  const images = await enrichImagesWithUrls(listing.images);
  return { ...listing, images };
}
