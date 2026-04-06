import { api } from '@/lib/api';
import type { Notification } from '@/types';

interface ApiNotification {
  id: string;
  kind: Notification['kind'];
  title: string;
  body?: string | null;
  target_id: string;
  section_subject_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

function mapNotification(item: ApiNotification): Notification {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    body: item.body ?? undefined,
    target_id: item.target_id,
    section_subject_id: item.section_subject_id ?? undefined,
    is_read: item.is_read,
    read_at: item.read_at ?? undefined,
    created_at: item.created_at,
  };
}

interface NotificationListResponse {
  results: ApiNotification[];
  next?: string | null;
  previous?: string | null;
}

export const notificationService = {
  async list(page = 1): Promise<{ results: Notification[]; nextPage?: number | null }> {
    const { data } = await api.get<NotificationListResponse>('/api/notifications/', {
      params: { page },
    });
    const results = (data?.results ?? []).map(mapNotification);
    let nextPage: number | null = null;
    if (data?.next) {
      try {
        const url = new URL(data.next);
        const next = url.searchParams.get('page');
        if (next) {
          nextPage = Number(next);
        }
      } catch {
        nextPage = null;
      }
    }
    return { results, nextPage };
  },
  async markRead(ids: string[]): Promise<void> {
    await api.post('/api/notifications/mark_read/', { ids });
  },
  async markAllRead(): Promise<void> {
    await api.post('/api/notifications/mark_read/', { all: true });
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/notifications/${id}/`);
  },
  async bulkDelete(ids: string[]): Promise<void> {
    await api.post('/api/notifications/bulk_delete/', { ids });
  },
  async deleteAll(): Promise<void> {
    await api.post('/api/notifications/bulk_delete/', { all: true });
  },
  async getWsToken(): Promise<string> {
    const { data } = await api.get<{ token?: string }>('/api/users/chat-ws-token/');
    return data?.token ?? '';
  },
};
