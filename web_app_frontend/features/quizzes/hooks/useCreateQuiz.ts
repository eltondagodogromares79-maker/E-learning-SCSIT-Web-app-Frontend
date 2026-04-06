import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      title: string;
      description?: string;
      total_points: number;
      time_limit_minutes?: number;
      attempt_limit: number;
      due_date: string;
      ai_grade_on_submit?: boolean;
    }) => quizService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      showToast({ title: 'Quiz saved', description: 'Manual quiz created.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Save failed', description: 'Unable to create quiz.', variant: 'error' });
    },
  });
}
