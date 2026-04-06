import { useMutation } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import axios from 'axios';

export function useAiGenerateAssignment() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      section_subject: string;
      prompt: string;
      due_date?: string;
      total_points?: number;
      allow_late_submission?: boolean;
    }) => assignmentService.aiPreview(payload),
    onSuccess: async () => {
      showToast({ title: 'Draft ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        showToast({ title: 'Rate limited', description: 'Rate limited — try again in 60s.', variant: 'error' });
        return;
      }
      showToast({ title: 'AI generation failed', description: 'You can still create assignments manually.', variant: 'error' });
    },
  });
}
