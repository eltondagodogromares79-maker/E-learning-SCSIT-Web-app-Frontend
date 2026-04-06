import { useMutation } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useStartAttendanceSession() {
  return useMutation({
    mutationFn: (sessionId: string) => attendanceService.startSession(sessionId),
  });
}
