import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

export function useStudentPerformance() {
  return useQuery({
    queryKey: ['dashboard', 'student-performance'],
    queryFn: () => dashboardService.studentPerformance(),
  });
}

