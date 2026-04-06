import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useAttendanceSessions(params?: { section_subject?: string; section?: string }) {
  return useQuery({
    queryKey: ['attendance', 'sessions', params],
    queryFn: () => attendanceService.listSessions(params),
    enabled: params ? Boolean(params.section_subject || params.section) : true,
    refetchInterval: 8000,
  });
}
