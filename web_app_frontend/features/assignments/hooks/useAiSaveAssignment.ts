import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

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
      showToast({ title: '✅ Assignment Saved', description: 'AI draft saved successfully.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'assignment save'),
  });
}
