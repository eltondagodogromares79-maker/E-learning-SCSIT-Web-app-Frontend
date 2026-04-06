import { useQuery } from '@tanstack/react-query';
import { sectionService } from '@/features/sections/services/sectionService';

export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionService.list(),
  });
}
