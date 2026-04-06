import { useMutation } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

export function useAiGenerateLesson() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      prompt: string;
    type: 'text' | 'pdf';
      file_url?: string;
    }) => lessonService.aiPreview(payload),
    onSuccess: async () => {
      showToast({ title: 'Draft ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        showToast({ title: 'Rate limited', description: 'Rate limited — try again in 60s.', variant: 'error' });
        return;
      }
      showToast({ title: 'AI generation failed', description: 'You can still create lessons manually.', variant: 'error' });
    },
  });
}
