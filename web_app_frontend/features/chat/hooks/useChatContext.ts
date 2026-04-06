import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/features/chat/services/chatService';

export function useChatContext() {
  return useQuery({
    queryKey: ['chat-context'],
    queryFn: () => chatService.getContext(),
  });
}
