import { useQuery } from '@tanstack/react-query';
import { lessonService } from '@/features/lessons/services/lessonService';

export function useLessons() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: () => lessonService.list(),
  });
}
