import { useQuery } from '@tanstack/react-query';
import { gradeService } from '@/features/grades/services/gradeService';

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: () => gradeService.list(),
  });
}
