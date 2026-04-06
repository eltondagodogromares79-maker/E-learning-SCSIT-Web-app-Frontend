import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/features/students/services/studentService';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.list(),
  });
}
