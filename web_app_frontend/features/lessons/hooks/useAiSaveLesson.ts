import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

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
      showToast({ title: '✅ Material Saved', description: 'AI draft saved successfully.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'lesson save'),
  });
}
