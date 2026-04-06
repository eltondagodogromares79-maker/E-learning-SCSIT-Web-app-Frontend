import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export function useEndAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => attendanceService.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'session'] });
    },
  });
}
