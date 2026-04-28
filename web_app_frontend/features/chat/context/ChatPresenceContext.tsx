'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { chatService } from '@/features/chat/services/chatService';
import { env } from '@/lib/env';

type ChatPresenceContextValue = {
  onlineUsers: Set<string>;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
};

const ChatPresenceContext = createContext<ChatPresenceContextValue>({
  onlineUsers: new Set(),
  status: 'idle',
});

export function ChatPresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isInitializing } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const socketRef = useRef<WebSocket | null>(null);
  const shouldConnect = !isInitializing && Boolean(user?.id) && pathname.startsWith('/dashboard');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shouldConnect) {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket?.readyState === WebSocket.CONNECTING) {
        socket.addEventListener('open', () => socket.close(), { once: true });
      }
      socketRef.current = null;
      return;
    }

    let isMounted = true;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const connect = async () => {
      if (!isMounted) return;
      setStatus('connecting');
      try {
        const token = await chatService.getWsToken();
        if (!isMounted) return;
        const separator = env.CHAT_WS_URL.includes('?') ? '&' : '?';
        const wsUrl = token
          ? `${env.CHAT_WS_URL}${separator}token=${encodeURIComponent(token)}`
          : env.CHAT_WS_URL;

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          retryCount = 0;
          setStatus('connected');
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setStatus('disconnected');
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          retryCount += 1;
          retryTimeout = setTimeout(() => {
            connect().catch(() => undefined);
          }, delay);
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setStatus('disconnected');
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { type?: string; user_ids?: string[] };
            if (payload.type === 'presence' && Array.isArray(payload.user_ids)) {
              setOnlineUsers(new Set(payload.user_ids.map((id) => String(id))));
            }
          } catch {
            // Ignore non-presence events in shared presence channel.
          }
        };
      } catch {
        if (!isMounted) return;
        setStatus('disconnected');
      }
    };

    connect().catch(() => undefined);

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      setStatus('idle');
      setOnlineUsers(new Set());
      const socket = socketRef.current;
      if (!socket) return;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener('open', () => socket.close(), { once: true });
      }
      socketRef.current = null;
    };
  }, [shouldConnect]);

  const value = useMemo(
    () => ({
      onlineUsers: shouldConnect ? onlineUsers : new Set<string>(),
      status: shouldConnect ? status : 'idle',
    }),
    [onlineUsers, shouldConnect, status]
  );

  return (
    <ChatPresenceContext.Provider value={value}>
      {children}
    </ChatPresenceContext.Provider>
  );
}

export function useChatPresence() {
  return useContext(ChatPresenceContext);
}
