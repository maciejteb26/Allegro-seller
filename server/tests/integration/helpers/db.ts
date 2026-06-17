import { prisma } from '../../../src/utils/prisma';

export async function resetDb(): Promise<void> {
  await prisma.platformListing.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.marginRule.deleteMany();
  await prisma.userPlatform.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.client.deleteMany();
  await prisma.platformCategoryMapping.deleteMany();
  await prisma.internalCategory.deleteMany();
  await prisma.user.deleteMany();
}
