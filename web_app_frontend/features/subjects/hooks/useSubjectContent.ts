import { useQuery } from '@tanstack/react-query';
import { subjectService } from '@/features/subjects/services/subjectService';

export function useSubjectContent(subjectId?: string) {
  return useQuery({
    queryKey: ['subjects', 'content', subjectId],
    queryFn: () => subjectService.getContent(subjectId as string),
    enabled: Boolean(subjectId),
  });
}
