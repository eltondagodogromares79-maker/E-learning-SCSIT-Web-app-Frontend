import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useToast } from '@/components/ui/toast';

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => lessonService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      showToast({ title: 'Lesson deleted', description: 'Lesson removed.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Delete failed', description: 'Unable to delete lesson.', variant: 'error' });
    },
  });
}
