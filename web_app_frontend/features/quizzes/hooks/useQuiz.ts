import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ['quizzes', quizId],
    queryFn: () => quizService.get(quizId),
    enabled: Boolean(quizId),
  });
}
