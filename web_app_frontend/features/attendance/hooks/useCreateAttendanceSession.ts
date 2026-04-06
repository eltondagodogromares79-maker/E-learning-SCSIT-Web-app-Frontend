import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { useToast } from '@/components/ui/toast';

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: attendanceService.createSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
      showToast({ title: 'Attendance created', description: 'Session is ready to mark.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Attendance failed', description: 'Unable to create attendance.', variant: 'error' });
    },
  });
}
