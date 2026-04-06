import { useMutation } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

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
    }) => quizService.aiPreview(payload),
    onSuccess: async () => {
      showToast({ title: 'Draft ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        showToast({ title: 'Rate limited', description: 'Rate limited — try again in 60s.', variant: 'error' });
        return;
      }
      showToast({ title: 'AI generation failed', description: 'You can still create quizzes manually.', variant: 'error' });
    },
  });
}
