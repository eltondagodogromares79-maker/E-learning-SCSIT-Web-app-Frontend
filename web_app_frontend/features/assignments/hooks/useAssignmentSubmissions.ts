import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';

export function useAssignmentSubmissions() {
  return useQuery({
    queryKey: ['assignments', 'submissions'],
    queryFn: () => assignmentService.listSubmissions(),
  });
}
