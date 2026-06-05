import { Platform } from '@prisma/client';
import { prisma } from '../utils/prisma';

const TITLE_LIMIT = 75;

interface ListingForTitle {
  category: { name: string };
  productBrand?: string | null;
  condition: string;
  vehicleMakeId?: string | null;
  vehicleModelId?: string | null;
  vehicleYearRaw?: number | null;
  partSide?: string | null;
  partDetails?: string | null;
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'nowa',
  USED: 'uzywana',
  DAMAGED: 'uszkodzona',
};

export function getTitleLimits(): Record<Platform, number> {
  return { ALLEGRO: TITLE_LIMIT };
}

export async function generateTitleForAllPlatforms(listing: ListingForTitle): Promise<Record<Platform, string>> {
  const title = await generateTitle(listing);
  return { ALLEGRO: title };
}

export async function generateTitle(listing: ListingForTitle, _platform: Platform = Platform.ALLEGRO): Promise<string> {
  const [make, model] = await Promise.all([
    resolveMakeName(listing.vehicleMakeId),
    resolveModelName(listing.vehicleModelId),
  ]);

  const parts = compact([
    listing.productBrand,
    listing.category.name,
    make,
    model,
    listing.vehicleYearRaw?.toString(),
    listing.partSide?.toLowerCase(),
    CONDITION_LABELS[listing.condition],
    listing.partDetails,
  ]);

  const mandatory = compact([listing.productBrand, listing.category.name, make, model]);
  const fitted = fitToLimit(parts, mandatory, TITLE_LIMIT);
  return fitted || mandatory.join(' ').trim();
}

function fitToLimit(parts: string[], mandatory: string[], limit: number): string {
  const mutable = [...parts];
  while (mutable.length > mandatory.length) {
    const candidate = mutable.join(' ').trim();
    if (candidate.length <= limit) return candidate;
    mutable.pop();
  }

  const mandatoryTitle = mandatory.join(' ').trim();
  if (mandatoryTitle.length <= limit) return mandatoryTitle;
  return mandatoryTitle.slice(0, limit).trim();
}

function compact(values: Array<string | undefined | null>): string[] {
  return values.map((value) => (value ?? '').trim()).filter(Boolean);
}

async function resolveMakeName(makeId?: string | null): Promise<string | undefined> {
  if (!makeId) return undefined;
  const make = await prisma.vehicleMake.findUnique({ where: { id: makeId }, select: { name: true } });
  return make?.name;
}

async function resolveModelName(modelId?: string | null): Promise<string | undefined> {
  if (!modelId) return undefined;
  const model = await prisma.vehicleModel.findUnique({ where: { id: modelId }, select: { name: true } });
  return model?.name;
}
