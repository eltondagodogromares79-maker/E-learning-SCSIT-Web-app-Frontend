import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

export function useAiGradeQuizAttempt() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (attemptId: string) => quizService.aiGradeAttempt(attemptId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes', 'attempts'] });
      showToast({ title: 'AI grading complete', description: 'Quiz attempt scored successfully.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'AI grade failed', description: 'Unable to grade quiz attempt.', variant: 'error' });
    },
  });
}
