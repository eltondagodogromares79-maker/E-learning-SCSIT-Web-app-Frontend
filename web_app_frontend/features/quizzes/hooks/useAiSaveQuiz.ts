import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

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
    }) => quizService.aiSave(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      showToast({ title: 'Quiz saved', description: 'AI draft saved successfully.', variant: 'success' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        showToast({ title: 'Rate limited', description: 'Rate limited — try again in 60s.', variant: 'error' });
        return;
      }
      showToast({ title: 'Save failed', description: 'Unable to save AI draft.', variant: 'error' });
    },
  });
}
