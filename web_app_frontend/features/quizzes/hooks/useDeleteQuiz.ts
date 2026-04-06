import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => quizService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      showToast({ title: 'Quiz deleted', description: 'Quiz removed.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Delete failed', description: 'Unable to delete quiz.', variant: 'error' });
    },
  });
}
