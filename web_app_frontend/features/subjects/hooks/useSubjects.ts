import { useQuery } from '@tanstack/react-query';
import { subjectService } from '@/features/subjects/services/subjectService';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.list(),
  });
}
