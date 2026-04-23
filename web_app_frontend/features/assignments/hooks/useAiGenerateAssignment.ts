import { useMutation } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';
import { handleAiError } from '@/lib/aiError';

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
      showToast({ title: '✨ Draft Ready', description: 'Review the AI draft before saving.', variant: 'success' });
    },
    onError: (err) => handleAiError(err, showToast, 'assignment generation'),
  });
}
