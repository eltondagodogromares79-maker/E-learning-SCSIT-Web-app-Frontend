import { useQuery } from '@tanstack/react-query';
import { quizService } from '@/features/quizzes/services/quizService';

export function useQuizAttempts(quizId?: string) {
  return useQuery({
    queryKey: ['quizzes', 'attempts', quizId],
    queryFn: () => (quizId ? quizService.listAttempts(quizId) : quizService.listAttemptsAll()),
  });
}
