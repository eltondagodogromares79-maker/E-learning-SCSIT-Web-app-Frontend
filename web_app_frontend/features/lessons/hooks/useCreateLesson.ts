import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';

export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: FormData | {
      section_subject: string;
      title: string;
      description?: string;
    type: 'text' | 'pdf' | 'link' | 'video';
      file_url?: string;
    }) => lessonService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      showToast({ title: 'Lesson created', description: 'Your lesson was saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Save failed', description: 'Unable to create lesson.', variant: 'error' });
    },
  });
}
