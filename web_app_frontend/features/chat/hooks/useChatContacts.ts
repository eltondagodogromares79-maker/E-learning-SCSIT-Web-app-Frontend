import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/features/chat/services/chatService';

export function useChatContacts() {
  return useQuery({
    queryKey: ['chat', 'contacts'],
    queryFn: () => chatService.getContacts(),
  });
}
