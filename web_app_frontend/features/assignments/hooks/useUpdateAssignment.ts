import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: { id: string; data: {
      title?: string;
      description?: string;
      total_points?: number;
      due_date?: string;
      allow_late_submission?: boolean;
    } }) => assignmentService.update(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      showToast({ title: 'Assignment updated', description: 'Changes saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Update failed', description: 'Unable to update assignment.', variant: 'error' });
    },
  });
}
