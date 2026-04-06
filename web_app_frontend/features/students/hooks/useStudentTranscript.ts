import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/features/students/services/studentService';

export function useStudentTranscript() {
  return useQuery({
    queryKey: ['student-transcript'],
    queryFn: () => studentService.transcript(),
  });
}
