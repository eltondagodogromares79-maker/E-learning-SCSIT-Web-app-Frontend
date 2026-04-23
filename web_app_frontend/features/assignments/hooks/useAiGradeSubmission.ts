import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

export function useAiGradeSubmission() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (submissionId: string) => assignmentService.aiGradeSubmission(submissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions'] });
      showToast({ title: '✅ AI Grade Ready', description: 'AI scoring completed successfully.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'grading'),
  });
}
