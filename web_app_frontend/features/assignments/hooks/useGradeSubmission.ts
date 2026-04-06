import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: { submissionId: string; score?: number | null; feedback?: string | null }) =>
      assignmentService.gradeSubmission(payload.submissionId, {
        score: payload.score,
        feedback: payload.feedback,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions'] });
      showToast({ title: 'Grade saved', description: 'The submission was graded.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Grade failed', description: 'Unable to save the grade.', variant: 'error' });
    },
  });
}
