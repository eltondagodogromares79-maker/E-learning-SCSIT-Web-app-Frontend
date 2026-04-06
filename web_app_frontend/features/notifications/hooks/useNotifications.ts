'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';
import { notificationService } from '@/features/notifications/services/notificationService';

import { env } from '@/lib/env';

const buildWsUrl = (token: string) => {
  const base = env.NOTIFICATIONS_WS_URL;
  if (!token) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

export function useNotifications() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const notificationsQuery = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) => notificationService.list(Number(pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    refetchOnWindowFocus: false,
  });

  const notifications = useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.results) ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const pushNotification = useCallback(
    (incoming: Notification) => {
      queryClient.setQueryData(['notifications'], (prev) => {
        if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
        const data = prev as {
          pages: Array<{ results: Notification[]; nextPage?: number | null }>;
          pageParams: unknown[];
        };
        const first = data.pages[0];
        if (!first) {
          return {
            ...data,
            pages: [{ results: [incoming], nextPage: data.pages[0]?.nextPage }],
          };
        }
        if (first.results.some((item) => item.id === incoming.id)) {
          return data;
        }
        const updatedFirst = { ...first, results: [incoming, ...first.results] };
        return {
          ...data,
          pages: [updatedFirst, ...data.pages.slice(1)],
        };
      });
    },
    [queryClient]
  );

  const markRead = useCallback(
    async (id: string) => {
      await notificationService.markRead([id]);
      queryClient.setQueryData(['notifications'], (prev) => {
        if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
        const data = prev as {
          pages: Array<{ results: Notification[]; nextPage?: number | null }>;
          pageParams: unknown[];
        };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            results: page.results.map((item) =>
              item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
            ),
          })),
        };
      });
    },
    [queryClient]
  );

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    queryClient.setQueryData(['notifications'], (prev) => {
      if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
      const data = prev as {
        pages: Array<{ results: Notification[]; nextPage?: number | null }>;
        pageParams: unknown[];
      };
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          results: page.results.map((item) => ({
            ...item,
            is_read: true,
            read_at: item.read_at ?? new Date().toISOString(),
          })),
        })),
      };
    });
  }, [queryClient]);

  const remove = useCallback(
    async (id: string) => {
      await notificationService.remove(id);
      queryClient.setQueryData(['notifications'], (prev) => {
        if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
        const data = prev as {
          pages: Array<{ results: Notification[]; nextPage?: number | null }>;
          pageParams: unknown[];
        };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            results: page.results.filter((item) => item.id !== id),
          })),
        };
      });
    },
    [queryClient]
  );

  const removeMany = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await notificationService.bulkDelete(ids);
      queryClient.setQueryData(['notifications'], (prev) => {
        if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
        const data = prev as {
          pages: Array<{ results: Notification[]; nextPage?: number | null }>;
          pageParams: unknown[];
        };
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            results: page.results.filter((item) => !ids.includes(item.id)),
          })),
        };
      });
    },
    [queryClient]
  );

  const removeAll = useCallback(async () => {
    await notificationService.deleteAll();
    queryClient.setQueryData(['notifications'], (prev) => {
      if (!prev || typeof prev !== 'object' || !('pages' in prev)) return prev;
      const data = prev as {
        pages: Array<{ results: Notification[]; nextPage?: number | null }>;
        pageParams: unknown[];
      };
      return {
        ...data,
        pages: data.pages.map((page) => ({ ...page, results: [] })),
      };
    });
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;
    let socket: WebSocket | null = null;

    notificationService
      .getWsToken()
      .then((token) => {
        if (!mounted) return;
        const wsUrl = buildWsUrl(token);
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        socket.onopen = () => setConnected(true);
        socket.onclose = () => setConnected(false);
        socket.onerror = () => setConnected(false);
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string; data?: Notification };
            if (payload.type === 'notification' && payload.data) {
              pushNotification(payload.data);
            }
          } catch {
            // ignore
          }
        };
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      socket?.close();
    };
  }, [pushNotification]);

  return {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
    remove,
    removeMany,
    removeAll,
    hasNextPage: notificationsQuery.hasNextPage ?? false,
    fetchNextPage: notificationsQuery.fetchNextPage,
    isFetchingNextPage: notificationsQuery.isFetchingNextPage ?? false,
  };
}
