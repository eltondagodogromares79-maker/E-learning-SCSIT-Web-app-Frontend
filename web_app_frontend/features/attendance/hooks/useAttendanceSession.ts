import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useAttendanceSession(sessionId: string) {
  return useQuery({
    queryKey: ['attendance', 'session', sessionId],
    queryFn: () => attendanceService.getSession(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: 8000,
  });
}
