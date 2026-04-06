import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useAttendanceSummary(
  params?: { section_subject?: string; section?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['attendance', 'summary', params],
    queryFn: () => attendanceService.listSummary(params),
    enabled: options?.enabled ?? true,
  });
}
