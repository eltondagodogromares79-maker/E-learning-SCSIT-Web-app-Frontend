import { useQuery } from '@tanstack/react-query';
import { publicSectionService, type PublicSectionResponse } from '@/features/sections/services/publicSectionService';

export function usePublicSections(params?: { search?: string; page?: number }) {
  return useQuery<PublicSectionResponse>({
    queryKey: ['public', 'sections', params?.search ?? '', params?.page ?? 1],
    queryFn: () => publicSectionService.list(params),
    keepPreviousData: true,
  });
}
