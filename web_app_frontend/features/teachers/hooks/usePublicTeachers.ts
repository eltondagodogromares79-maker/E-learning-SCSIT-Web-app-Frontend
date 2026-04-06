import { useQuery } from '@tanstack/react-query';
import { publicTeacherService, type PublicTeacherResponse } from '@/features/teachers/services/publicTeacherService';

export function usePublicTeachers(params?: { search?: string; page?: number; role?: string }) {
  return useQuery<PublicTeacherResponse>({
    queryKey: ['public', 'teachers', params?.search ?? '', params?.page ?? 1, params?.role ?? ''],
    queryFn: () => publicTeacherService.list(params),
    keepPreviousData: true,
  });
}
