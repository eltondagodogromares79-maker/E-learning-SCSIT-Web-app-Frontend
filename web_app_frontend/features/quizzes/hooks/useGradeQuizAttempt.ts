import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

export function useGradeQuizAttempt() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (payload: { attemptId: string; score?: number }) =>
      quizService.gradeAttempt(payload.attemptId, { score: payload.score }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes', 'attempts'] });
      showToast({ title: 'Score updated', description: 'Quiz attempt has been graded.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Grade failed', description: 'Unable to update quiz score.', variant: 'error' });
    },
  });
}
