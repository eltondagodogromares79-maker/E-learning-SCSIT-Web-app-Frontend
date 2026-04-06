import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useAttendanceRecords(sessionId: string) {
  return useQuery({
    queryKey: ['attendance', 'records', sessionId],
    queryFn: () => attendanceService.listRecords(sessionId),
    enabled: Boolean(sessionId),
  });
}
