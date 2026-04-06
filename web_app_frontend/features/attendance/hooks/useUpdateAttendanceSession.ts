import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { useToast } from '@/components/ui/toast';

export function useUpdateAttendanceSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: Record<string, unknown> }) =>
      attendanceService.updateSession(sessionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      showToast({ title: 'Session updated', description: 'Changes saved.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Update failed', description: 'Unable to update session.', variant: 'error' });
    },
  });
}
