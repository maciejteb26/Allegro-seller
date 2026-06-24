import { Platform, PlatformStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { getAllegroSellerOffers } from './allegro-api.service';

export async function syncAllegroOfferStats(userId: string): Promise<void> {
  if (env.ALLEGRO_MOCK) return;

  const connected = await prisma.userPlatform.findFirst({
    where: { userId, platform: Platform.ALLEGRO, isActive: true },
  });
  if (!connected) return;

  const listings = await prisma.platformListing.findMany({
    where: {
      platform: Platform.ALLEGRO,
      status: PlatformStatus.ACTIVE,
      externalId: { not: null },
      listing: { userId },
    },
    select: { id: true, externalId: true },
  });

  if (listings.length === 0) return;

  const offerMap = new Map(listings.map((item) => [item.externalId!, item.id]));
  const offers = await getAllegroSellerOffers(userId, [...offerMap.keys()]);
  const now = new Date();

  await Promise.all(
    offers.map((offer) => {
      const rowId = offerMap.get(offer.id);
      if (!rowId) return Promise.resolve();

      return prisma.platformListing.update({
        where: { id: rowId },
        data: {
          visitsCount: offer.stats?.visitsCount ?? 0,
          watchersCount: offer.stats?.watchersCount ?? 0,
          soldCount: offer.stock?.sold ?? 0,
          lastSyncedAt: now,
        },
      });
    }),
  );

  logger.info('allegro_stats_synced', { userId, count: offers.length });
}
