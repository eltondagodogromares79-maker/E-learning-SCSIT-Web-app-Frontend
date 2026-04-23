import { useQuery } from '@tanstack/react-query';
import { publicStatsService } from '../services/publicStatsService';

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: () => publicStatsService.get(),
    staleTime: 1000 * 60 * 5,
  });
}
