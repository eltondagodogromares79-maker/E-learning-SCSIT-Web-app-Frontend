import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

export function useAiGradeQuizAttempt() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (attemptId: string) => quizService.aiGradeAttempt(attemptId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes', 'attempts'] });
      showToast({ title: '✅ AI Grading Complete', description: 'Quiz attempt scored successfully.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'quiz grading'),
  });
}
