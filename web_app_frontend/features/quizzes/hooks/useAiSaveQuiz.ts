import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

export function useAiSaveQuiz() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      title: string;
      description?: string;
      due_date?: string;
      time_limit_minutes?: number | null;
      attempt_limit?: number;
      questions?: Array<Record<string, any>>;
      ai_grade_on_submit?: boolean;
      security_level?: 'normal' | 'strict';
      is_available?: boolean;
    }) => quizService.aiSave(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      showToast({ title: '✅ Quiz Saved', description: 'AI draft saved successfully.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'quiz save'),
  });
}
