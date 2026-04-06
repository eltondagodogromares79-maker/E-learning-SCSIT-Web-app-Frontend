import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';

export function useQuizzes() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: () => quizService.list(),
  });
}
