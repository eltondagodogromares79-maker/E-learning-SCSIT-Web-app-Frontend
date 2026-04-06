import { api } from '@/lib/api';
import type { ChatContext, ChatContact, ChatRoomPayload, ChatReadReceipt, ChatGroup } from '@/types';

export const chatService = {
  async getContext(): Promise<ChatContext> {
    const { data } = await api.get<ChatContext>('/api/users/chat-context/');
    return data;
  },
  async getContacts(): Promise<ChatContact[]> {
    const { data } = await api.get<ChatContact[]>('/api/chat/contacts/');
    return data;
  },
  async searchUsers(query: string): Promise<ChatContact[]> {
    const { data } = await api.get<ChatContact[]>('/api/chat/contacts/', {
      params: { q: query },
    });
    return data;
  },
  async getAllUsers(): Promise<ChatContact[]> {
    const { data } = await api.get<ChatContact[]>('/api/chat/contacts/', {
      params: { all: true },
    });
    return data;
  },
  async reactToMessage(messageId: string, emoji: string): Promise<{ message_id: string; reactions: Record<string, string[]> }> {
    const { data } = await api.post('/api/chat/reactions/', { message_id: messageId, emoji });
    return data;
  },
  async getMessages(
    roomKey: string,
    options?: { limit?: number; before?: string | null }
  ): Promise<ChatRoomPayload> {
    const { data } = await api.get<ChatRoomPayload>('/api/chat/messages/', {
      params: { room_key: roomKey, limit: options?.limit, before: options?.before ?? undefined },
    });
    return data;
  },
  async markRead(roomKey: string, lastReadAt: string): Promise<ChatReadReceipt> {
    const { data } = await api.post<ChatReadReceipt>('/api/chat/read/', {
      room_key: roomKey,
      last_read_at: lastReadAt,
    });
    return data;
  },
  async getWsToken(): Promise<string> {
    const { data } = await api.get<{ token: string }>('/api/users/chat-ws-token/');
    return data.token;
  },
  async getGroups(): Promise<ChatGroup[]> {
    const { data } = await api.get<ChatGroup[]>('/api/chat/groups/');
    return data;
  },
  async createGroup(name: string, members: string[]): Promise<ChatGroup> {
    const { data } = await api.post<ChatGroup>('/api/chat/groups/', { name, members });
    return data;
  },
  async addGroupMembers(roomKey: string, members: string[]): Promise<ChatGroup> {
    const { data } = await api.post<ChatGroup>(`/api/chat/groups/${encodeURIComponent(roomKey)}/members/`, { members });
    return data;
  },
  async getGroupMembers(roomKey: string): Promise<ChatContact[]> {
    const { data } = await api.get<ChatContact[]>(`/api/chat/groups/${encodeURIComponent(roomKey)}/members/`);
    return data;
  },
  async leaveGroup(roomKey: string) {
    await api.delete(`/api/chat/groups/${encodeURIComponent(roomKey)}/members/`);
  },
  async updateMessage(messageId: string, content: string) {
    const { data } = await api.patch(`/api/chat/messages/${messageId}/`, { content });
    return data as { id: string; content: string };
  },
  async deleteMessage(messageId: string) {
    await api.delete(`/api/chat/messages/${messageId}/`);
  },
  async deleteConversation(roomKey: string) {
    await api.delete(`/api/chat/conversations/${encodeURIComponent(roomKey)}/`);
  },
};
