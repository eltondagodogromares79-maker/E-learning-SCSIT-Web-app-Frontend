'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { chatService } from '@/features/chat/services/chatService';
import { env } from '@/lib/env';

type IncomingMessage =
  | { type: 'direct'; from: string; room: string }
  | { type: 'group'; from: string; room: string }
  | { type: 'read'; room: string; user_id: string };

const buildWsUrl = (token: string) => {
  const base = env.CHAT_WS_URL;
  if (!token) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

export function useChatBadge() {
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem('chat_unread_rooms');
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  });
  const [wsToken, setWsToken] = useState('');
  const [wsReady, setWsReady] = useState(false);
  const pathname = usePathname();
  const userIdRef = useRef<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isOnChat = useMemo(() => pathname?.includes('/chat'), [pathname]);
  const unreadCount = unreadRooms.size;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('chat_unread_rooms', JSON.stringify(Array.from(unreadRooms)));
    } catch {
      // ignore
    }
  }, [unreadRooms]);

  useEffect(() => {
    let active = true;
    chatService
      .getContext()
      .then((ctx) => {
        if (active) userIdRef.current = ctx.id;
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    chatService
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
    if (isOnChat || !wsReady) return;

    const wsUrl = buildWsUrl(wsToken);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as IncomingMessage;
        if (payload.type === 'direct' || payload.type === 'group') {
          if (payload.from && payload.from !== userIdRef.current) {
            if (payload.room) {
              setUnreadRooms((prev) => {
                const next = new Set(prev);
                next.add(payload.room);
                return next;
              });
            }
          }
        }
        if (payload.type === 'read' && payload.user_id === userIdRef.current) {
          setUnreadRooms((prev) => {
            if (!prev.has(payload.room)) return prev;
            const next = new Set(prev);
            next.delete(payload.room);
            return next;
          });
        }
      } catch {
        // ignore
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [isOnChat, wsReady, wsToken]);

  return { unreadCount, resetUnread: () => setUnreadRooms(new Set()) };
}
