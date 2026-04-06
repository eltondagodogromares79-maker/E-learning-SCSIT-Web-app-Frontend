import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      title: string;
      description?: string;
      total_points: number;
      due_date: string;
      allow_late_submission: boolean;
    }) => assignmentService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      showToast({ title: 'Assignment saved', description: 'Manual assignment created.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Save failed', description: 'Unable to create assignment.', variant: 'error' });
    },
  });
}
