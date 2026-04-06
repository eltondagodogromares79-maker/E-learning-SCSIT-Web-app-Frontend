import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';

export function useLesson(id: string) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonService.get(id),
    enabled: Boolean(id),
  });
}
