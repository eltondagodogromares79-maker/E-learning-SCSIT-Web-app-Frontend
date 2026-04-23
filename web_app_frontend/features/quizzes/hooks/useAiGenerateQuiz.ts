import { useMutation } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

export function useAiGenerateQuiz() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      prompt: string;
      due_date?: string;
      time_limit_minutes?: number;
      attempt_limit?: number;
      ai_grade_on_submit?: boolean;
      security_level?: 'normal' | 'strict';
      is_available?: boolean;
    }) => quizService.aiPreview(payload),
    onSuccess: async () => {
      showToast({ title: '✨ Draft Ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'quiz generation'),
  });
}
