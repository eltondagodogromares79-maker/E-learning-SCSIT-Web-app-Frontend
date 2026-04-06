import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: { id: string; data: {
      title?: string;
      description?: string;
      total_points?: number;
      time_limit_minutes?: number;
      attempt_limit?: number;
      due_date?: string;
      ai_grade_on_submit?: boolean;
      security_level?: 'normal' | 'strict';
      is_available?: boolean;
    } }) => quizService.update(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      showToast({ title: 'Quiz updated', description: 'Changes saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Update failed', description: 'Unable to update quiz.', variant: 'error' });
    },
  });
}
