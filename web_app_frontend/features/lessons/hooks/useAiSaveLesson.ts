import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

export function useAiSaveLesson() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      title: string;
      description: string;
      type: 'text' | 'pdf';
      file_url?: string;
    }) => lessonService.aiSave(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      showToast({ title: 'Lesson saved', description: 'AI draft saved successfully.', variant: 'success' });
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
