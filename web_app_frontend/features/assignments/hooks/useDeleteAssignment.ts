import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assignmentService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      showToast({ title: 'Assignment deleted', description: 'Assignment removed.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Delete failed', description: 'Unable to delete assignment.', variant: 'error' });
    },
  });
}
