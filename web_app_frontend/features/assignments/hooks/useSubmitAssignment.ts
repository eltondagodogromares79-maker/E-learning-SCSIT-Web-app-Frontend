import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useToast } from '@/components/ui/toast';

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      assignment: string;
      student: string;
      text_answer?: string;
      file_url?: string;
    }) => assignmentService.createSubmission(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments', 'submissions'] });
      showToast({ title: 'Submission sent', description: 'Your assignment was submitted.', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Submission failed', description: 'Unable to submit your assignment.', variant: 'error' });
    },
  });
}
