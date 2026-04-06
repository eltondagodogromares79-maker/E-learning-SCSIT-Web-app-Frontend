import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.list(),
  });
}
