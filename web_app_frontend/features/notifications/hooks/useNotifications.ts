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
  const [wsToken, setWsToken] = useState('');
  const [wsReady, setWsReady] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const notificationsQuery = useInfiniteQuery<{ results: Notification[]; nextPage?: number | null }>({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) => notificationService.list(Number(pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
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

  const upsertNotification = useCallback(
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
        const exists = data.pages.some((page) => page.results.some((item) => item.id === incoming.id));
        const updatedPages = data.pages.map((page) => ({
          ...page,
          results: page.results.map((item) => (item.id === incoming.id ? incoming : item)),
        }));
        const updatedFirst = exists
          ? updatedPages[0]
          : { ...updatedPages[0], results: [incoming, ...updatedPages[0].results] };
        return {
          ...data,
          pages: [updatedFirst, ...updatedPages.slice(1)],
        };
      });
    },
    [queryClient]
  );

  const removeNotifications = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
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
    let active = true;

    notificationService
      .getWsToken()
      .then((token) => {
        if (active) setWsToken(token);
      })
      .catch(() => {
        if (active) setWsToken('');
      })
      .finally(() => {
        if (active) setWsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!wsReady) return;
    const wsUrl = buildWsUrl(wsToken);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type?: 'notification'; data?: Notification }
          | { type?: 'notification_deleted'; data?: { ids?: string[] } };
        if (payload.type === 'notification' && payload.data) {
          upsertNotification(payload.data);
        }
        if (payload.type === 'notification_deleted') {
          const ids = Array.isArray(payload.data?.ids) ? payload.data.ids : [];
          removeNotifications(ids);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener(
          'open',
          () => {
            socket.close();
          },
          { once: true }
        );
      }
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [removeNotifications, upsertNotification, wsReady, wsToken]);

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
