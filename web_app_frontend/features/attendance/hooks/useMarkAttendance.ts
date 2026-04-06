import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { useToast } from '@/components/ui/toast';
import type { AttendanceStatus } from '@/types';

export function useMarkAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (records: Array<{ id: string; status: AttendanceStatus; note?: string }>) =>
      attendanceService.markRecords(sessionId, records),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'records', sessionId] });
      showToast({ title: 'Attendance updated', description: 'Changes saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Update failed', description: 'Unable to save attendance.', variant: 'error' });
    },
  });
}
