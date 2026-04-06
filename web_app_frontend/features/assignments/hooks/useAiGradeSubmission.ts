import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useAiGradeSubmission() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (submissionId: string) => assignmentService.aiGradeSubmission(submissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions'] });
      showToast({ title: 'AI grade ready', description: 'AI scoring completed.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'AI grading failed', description: 'Use manual grading instead.', variant: 'error' });
    },
  });
}
