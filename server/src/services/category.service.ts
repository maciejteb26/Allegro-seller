import { Platform, VehicleType } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';

export async function getCategoryTree() {
  const all = await prisma.internalCategory.findMany({
    orderBy: { name: 'asc' },
  });

  const roots = all.filter((c) => !c.parentId);
  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parentId === root.id),
  }));
}

export async function getVehicleMakes(type?: string) {
  const where = type && Object.values(VehicleType).includes(type as VehicleType)
    ? { types: { has: type as VehicleType } }
    : {};

  return prisma.vehicleMake.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, types: true },
  });
}

export async function getVehicleModels(makeId: string) {
  return prisma.vehicleModel.findMany({
    where: { makeId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, makeId: true },
  });
}

export async function getVehicleGenerations(modelId: string) {
  return prisma.vehicleGeneration.findMany({
    where: { modelId },
    orderBy: { yearFrom: 'asc' },
    select: { id: true, name: true, yearFrom: true, yearTo: true, modelId: true },
  });
}

export async function getExternalCategoryId(internalCategoryId: string, platform: Platform): Promise<string> {
  const mapping = await prisma.platformCategoryMapping.findUnique({
    where: { internalCategoryId_platform: { internalCategoryId, platform } },
    select: { externalCategoryId: true },
  });

  if (!mapping) {
    throw new AppError(400, `Missing category mapping for ${platform}`);
  }

  return mapping.externalCategoryId;
}

export async function getAttributeSchema(internalCategoryId: string, platform: Platform): Promise<object> {
  const mapping = await prisma.platformCategoryMapping.findUnique({
    where: { internalCategoryId_platform: { internalCategoryId, platform } },
    select: { attributeSchema: true },
  });

  if (!mapping) {
    throw new AppError(400, `Missing category mapping for ${platform}`);
  }

  return (mapping.attributeSchema as object | null) ?? {};
}

export async function getCategoryMappingsExport() {
  const categories = await prisma.internalCategory.findMany({
    where: { parentId: { not: null } },
    include: {
      parent: { select: { name: true, slug: true } },
      platformMappings: true,
    },
    orderBy: [{ parent: { name: 'asc' } }, { name: 'asc' }],
  });

  const platforms = Object.values(Platform);

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentName: category.parent?.name ?? null,
    parentSlug: category.parent?.slug ?? null,
    mappings: platforms.reduce(
      (acc, platform) => {
        const mapping = category.platformMappings.find((m) => m.platform === platform);
        acc[platform] = mapping
          ? {
              externalCategoryId: mapping.externalCategoryId,
              externalCategoryName: mapping.externalCategoryName,
            }
          : null;
        return acc;
      },
      {} as Record<Platform, { externalCategoryId: string; externalCategoryName: string | null } | null>,
    ),
  }));
}

export async function syncPlatformCategories(platform: Platform): Promise<void> {
  await prisma.platformCategoryMapping.updateMany({
    where: { platform },
    data: { cachedAt: new Date() },
  });
}
