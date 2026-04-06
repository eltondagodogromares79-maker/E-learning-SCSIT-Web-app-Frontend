import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

export function useStudentPerformanceDetail(studentId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'student-performance', studentId],
    queryFn: () => dashboardService.studentPerformanceDetail(studentId ?? ''),
    enabled: Boolean(studentId),
  });
}

