import { useQuery } from '@tanstack/react-query';
import { teacherService } from '@/features/teachers/services/teacherService';

export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.list(),
  });
}
