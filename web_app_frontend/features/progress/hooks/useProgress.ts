import { useQuery } from '@tanstack/react-query';
import { progressService } from '@/features/progress/services/progressService';

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: () => progressService.get(),
  });
}
