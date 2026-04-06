import { useQuery } from '@tanstack/react-query';
import { subjectService } from '@/features/subjects/services/subjectService';

export function useSectionSubjects() {
  return useQuery({
    queryKey: ['section-subjects'],
    queryFn: () => subjectService.listSectionSubjects(),
  });
}
