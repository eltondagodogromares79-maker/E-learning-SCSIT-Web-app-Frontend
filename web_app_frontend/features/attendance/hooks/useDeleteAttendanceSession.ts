import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { useToast } from '@/components/ui/toast';

export function useDeleteAttendanceSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => attendanceService.deleteSession(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      showToast({ title: 'Session deleted', description: 'Session removed.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Delete failed', description: 'Unable to delete session.', variant: 'error' });
    },
  });
}
