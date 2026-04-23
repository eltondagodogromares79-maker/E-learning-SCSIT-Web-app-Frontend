import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonService.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-lessons'] });
    },
  });
}
