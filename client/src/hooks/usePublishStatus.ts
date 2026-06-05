import { useQuery } from '@tanstack/react-query';
import { PlatformStatus } from '@/types';
import { getPublishStatus } from '@/api/platforms.api';

export function usePublishStatus(listingId: string | null) {
  return useQuery({
    queryKey: ['publish-status', listingId],
    queryFn: () => getPublishStatus(listingId as string),
    enabled: Boolean(listingId),
    refetchInterval: (query) => {
      const statuses = Object.values((query.state.data ?? {}) as Record<string, PlatformStatus>);
      if (!statuses.length) return 3000;
      const done = statuses.every((status) => status === 'ACTIVE' || status === 'ERROR');
      return done ? false : 3000;
    },
  });
}
