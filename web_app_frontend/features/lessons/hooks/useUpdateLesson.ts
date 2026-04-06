import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: { id: string; data: {
      title?: string;
      description?: string;
      type?: 'text' | 'pdf' | 'link' | 'video';
      file_url?: string;
    } }) => lessonService.update(payload.id, payload.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      showToast({ title: 'Lesson updated', description: 'Changes saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Update failed', description: 'Unable to update lesson.', variant: 'error' });
    },
  });
}
