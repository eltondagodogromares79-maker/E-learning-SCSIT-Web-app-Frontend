import { useMutation } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

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
      showToast({ title: '✨ Draft Ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'lesson generation'),
  });
}
