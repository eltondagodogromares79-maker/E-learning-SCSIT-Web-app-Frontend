import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

export function useAiSaveAssignment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      title: string;
      description: string;
      due_date?: string;
      total_points?: number;
      allow_late_submission?: boolean;
    }) => assignmentService.aiSave(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      showToast({ title: 'Assignment saved', description: 'AI draft saved successfully.', variant: 'success' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        showToast({ title: 'Rate limited', description: 'Rate limited — try again in 60s.', variant: 'error' });
        return;
      }
      showToast({ title: 'Save failed', description: 'Unable to save AI draft.', variant: 'error' });
    },
  });
}
