import { useQuery } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';

export function useFavoriteLessons() {
  return useQuery({
    queryKey: ['favorite-lessons'],
    queryFn: () => lessonService.listFavorites(),
  });
}
