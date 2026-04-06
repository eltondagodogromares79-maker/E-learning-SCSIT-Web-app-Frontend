'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreVertical, Search, User } from 'lucide-react';
import { useChatContext } from '@/features/chat/hooks/useChatContext';
import { useChatContacts } from '@/features/chat/hooks/useChatContacts';
import { chatService } from '@/features/chat/services/chatService';
import { useToast } from '@/components/ui/toast';
import type { ChatContact, ChatMessage, ChatReadReceipt } from '@/types';
import { env } from '@/lib/env';

type Room = {
  id: string;
  label: string;
  kind: 'section' | 'group' | 'direct';
  targetId?: string;
};

type IncomingMessage =
  | { type: 'connected'; user_id: string }
  | { type: 'presence'; user_ids: string[] }
  | { type: 'joined'; room: string }
  | { type: 'group_created'; room: string }
  | {
      type: 'group';
      room: string;
      from: string;
      content: string;
      sent_at: string;
      message_id?: string;
      kind?: string;
      reply_to_id?: string | null;
      reply_to_content?: string | null;
      reply_to_sender?: string | null;
      reactions?: Record<string, string[]>;
    }
  | {
      type: 'direct';
      room: string;
      from: string;
      content: string;
      sent_at: string;
      message_id?: string;
      kind?: string;
      reply_to_id?: string | null;
      reply_to_content?: string | null;
      reply_to_sender?: string | null;
      reactions?: Record<string, string[]>;
    }
  | { type: 'typing'; room: string; user_id: string; is_typing: boolean }
  | { type: 'read'; room: string; user_id: string; last_read_at: string }
  | { type: 'reaction'; room: string; message_id: string; reactions?: Record<string, string[]>; emoji?: string; user_id?: string }
  | { type: 'message_updated'; room: string; message_id: string; content: string }
  | { type: 'message_deleted'; room: string; message_id: string }
  | { type: 'error'; code?: string; message?: string };

const UNSENT_TOKEN = '__unsent__';

const buildDirectRoomId = (currentId: string, targetId: string) => {
  return currentId < targetId
    ? `dm:${currentId}:${targetId}`
    : `dm:${targetId}:${currentId}`;
};

const getDirectTargetId = (room: Room, currentUserId?: string | null) => {
  if (room.kind !== 'direct') return null;
  if (room.targetId) return room.targetId;
  if (!room.id.startsWith('dm:')) return null;
  const parts = room.id.split(':');
  if (parts.length !== 3) return null;
  const [, a, b] = parts;
  if (!currentUserId) return a;
  return a === currentUserId ? b : a;
};

export function ChatPanel() {
  const { data: chatContext } = useChatContext();
  const { data: contacts = [] } = useChatContacts();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hiddenRooms, setHiddenRooms] = useState<Set<string>>(new Set());
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [readReceipts, setReadReceipts] = useState<Record<string, ChatReadReceipt[]>>({});
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [typingByRoom, setTypingByRoom] = useState<Record<string, Set<string>>>({});
  const [messageInput, setMessageInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupMemberQuery, setGroupMemberQuery] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [addMembersRoomId, setAddMembersRoomId] = useState<string | null>(null);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const [existingGroupMembers, setExistingGroupMembers] = useState<string[]>([]);
  const [groupMetaByRoom, setGroupMetaByRoom] = useState<Record<string, { createdBy?: string | null }>>({});
  const [roomSearch, setRoomSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Room[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [allUsers, setAllUsers] = useState<Room[]>([]);
  const [allUsersData, setAllUsersData] = useState<ChatContact[]>([]);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [roomListLimit, setRoomListLimit] = useState(10);
  const [seenPopoverMessageId, setSeenPopoverMessageId] = useState<string | null>(null);
  const [roomPagination, setRoomPagination] = useState<
    Record<string, { hasMore: boolean; nextBefore: string | null; loading: boolean }>
  >({});
  const [roomMenuOpenId, setRoomMenuOpenId] = useState<string | null>(null);
  const [messageMenuOpenId, setMessageMenuOpenId] = useState<string | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDescription, setConfirmDescription] = useState('');
  const confirmActionRef = useRef<(() => void) | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [bubbleSwipeStart, setBubbleSwipeStart] = useState<number | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [wsToken, setWsToken] = useState<string>('');
  const [wsReady, setWsReady] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRoomRef = useRef<string>('');
  const userIdRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = useRef(false);
  const groupMembersRef = useRef<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('chat_unread_rooms');
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        const initial: Record<string, number> = {};
        parsed.forEach((roomId) => {
          initial[roomId] = 1;
        });
        setUnreadByRoom((prev) => ({ ...initial, ...prev }));
      }
    } catch {
      // ignore
    }
  }, []);

  const wsBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return env.CHAT_WS_URL;
  }, []);

  const wsUrl = useMemo(() => {
    if (!wsBaseUrl) return '';
    if (!wsToken) return wsBaseUrl;
    const separator = wsBaseUrl.includes('?') ? '&' : '?';
    return `${wsBaseUrl}${separator}token=${encodeURIComponent(wsToken)}`;
  }, [wsBaseUrl, wsToken]);

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((contact) => {
      map.set(contact.id, contact.full_name);
    });
    if (chatContext?.id) {
      map.set(chatContext.id, 'You');
    }
    return map;
  }, [contacts, chatContext?.id]);

  const allUserNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allUsersData.forEach((user) => map.set(user.id, user.full_name));
    contacts.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, user.full_name);
      }
    });
    if (chatContext?.id) {
      map.set(chatContext.id, 'You');
    }
    return map;
  }, [allUsersData, contacts, chatContext?.id]);

  const userAvatarMap = useMemo(() => {
    const map = new Map<string, string | null>();
    contacts.forEach((contact) => {
      map.set(contact.id, contact.profile_picture ?? null);
    });
    allUsersData.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, user.profile_picture ?? null);
      }
    });
    return map;
  }, [contacts, allUsersData]);

  useEffect(() => {
    groupMembersRef.current = groupMemberIds;
  }, [groupMemberIds]);

  useEffect(() => {
    if (!chatContext?.id) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('chat_unread_rooms');
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setRooms((prev) => {
        const next = [...prev];
        parsed.forEach((roomId) => {
          if (roomId.startsWith('section:')) return;
          if (next.find((item) => item.id === roomId)) return;
          if (roomId.startsWith('dm:')) {
            const parts = roomId.split(':');
            if (parts.length >= 3) {
              const a = parts[1];
              const b = parts[2];
              const targetId = chatContext.id === a ? b : a;
              const label = userNameMap.get(targetId) ?? targetId.slice(0, 8);
              next.push({ id: roomId, label, kind: 'direct', targetId });
            }
          } else if (roomId.startsWith('group:')) {
            next.push({ id: roomId, label: roomId.replace('group:', ''), kind: 'group' });
          }
        });
        return next;
      });
    } catch {
      // ignore
    }
  }, [chatContext?.id, userNameMap]);

  useEffect(() => {
    if (!chatContext?.id) return;
    chatService
      .getGroups()
      .then((groups) => {
        setGroupMetaByRoom((prev) => {
          const next = { ...prev };
          groups.forEach((group) => {
            next[group.room_key] = { createdBy: group.created_by ?? null };
          });
          return next;
        });
        setRooms((prev) => {
          const next = [...prev];
          groups.forEach((group) => {
            const label = group.name?.trim() || group.room_key.replace('group:', '');
            const existingIndex = next.findIndex((room) => room.id === group.room_key);
            if (existingIndex >= 0) {
              next[existingIndex] = { ...next[existingIndex], label, kind: 'group' };
            } else {
              next.push({ id: group.room_key, label, kind: 'group' });
            }
          });
          return next;
        });
      })
      .catch(() => undefined);
  }, [chatContext?.id]);

  useEffect(() => {
    if (!chatContext) return;
    setHiddenRooms(new Set(chatContext.hidden_rooms ?? []));
  }, [chatContext?.id, chatContext?.hidden_rooms]);

  useEffect(() => {
    if (!chatContext) return;
    const directRooms: Room[] = contacts.map((contact) => ({
      id: buildDirectRoomId(chatContext.id, contact.id),
      label: contact.full_name,
      kind: 'direct',
      targetId: contact.id,
    }));

    setRooms((prev) => {
      const merged = [...prev].filter((room) => room.kind !== 'section' && !room.id.startsWith('section:'));
      [...directRooms].forEach((room) => {
        if (hiddenRooms.has(room.id)) return;
        if (!merged.find((item) => item.id === room.id)) {
          merged.push(room);
        }
      });
      return merged;
    });
  }, [chatContext, contacts, activeRoom, hiddenRooms]);


  useEffect(() => {
    if (!chatContext?.id) return;
    chatService
      .getAllUsers()
      .then((users) => {
        const mapped = users.map((user) => ({
          id: buildDirectRoomId(chatContext.id, user.id),
          label: user.full_name,
          kind: 'direct' as const,
          targetId: user.id,
        }));
        setAllUsersData(users);
        setAllUsers(mapped);
      })
      .catch(() => {
        setAllUsers([]);
        setAllUsersData([]);
      });
  }, [chatContext?.id]);

  useEffect(() => {
    const query = roomSearch.trim();
    if (!query) {
      setSearchResults([]);
      setRoomListLimit(10);
      return;
    }
    const handle = setTimeout(() => {
      chatService
        .searchUsers(query)
        .then((results) => {
          if (!chatContext?.id) return;
          const mapped = results.map((user) => ({
            id: buildDirectRoomId(chatContext.id, user.id),
            label: user.full_name,
            kind: 'direct' as const,
            targetId: user.id,
          }));
          setSearchResults(mapped);
        })
        .catch(() => setSearchResults([]));
    }, 250);

    return () => clearTimeout(handle);
  }, [roomSearch, chatContext?.id]);

  const handleIncoming = useCallback(
    (payload: IncomingMessage) => {
      if (payload.type === 'error') {
        showToast({ title: 'Chat error', description: payload.message ?? 'Unknown error', variant: 'error' });
        return;
      }

      if (payload.type === 'joined' || payload.type === 'group_created') {
        if (payload.room.startsWith('section:')) {
          return;
        }
        setRooms((prev) => {
          if (prev.find((room) => room.id === payload.room)) return prev;
          return [
            ...prev,
            { id: payload.room, label: payload.room.replace('group:', ''), kind: 'group' },
          ];
        });
        return;
      }

      if (payload.type === 'typing') {
        setTypingByRoom((prev) => {
          const next = { ...prev };
          const set = new Set(next[payload.room] ?? []);
          if (payload.is_typing) {
            set.add(payload.user_id);
          } else {
            set.delete(payload.user_id);
          }
          next[payload.room] = set;
          return next;
        });
        return;
      }

      if (payload.type === 'read') {
        setReadReceipts((prev) => {
          const next = { ...prev };
          const existing = next[payload.room] ?? [];
          const updated = existing.filter((receipt) => receipt.user !== payload.user_id);
          updated.push({ user: payload.user_id, last_read_at: payload.last_read_at });
          next[payload.room] = updated;
          return next;
        });
        if (payload.user_id === userIdRef.current) {
          setUnreadByRoom((prev) => ({ ...prev, [payload.room]: 0 }));
          if (typeof window !== 'undefined') {
            try {
              const raw = window.localStorage.getItem('chat_unread_rooms');
              if (raw) {
                const parsed = JSON.parse(raw) as string[];
                const next = Array.isArray(parsed) ? parsed.filter((roomId) => roomId !== payload.room) : [];
                window.localStorage.setItem('chat_unread_rooms', JSON.stringify(next));
              }
            } catch {
              // ignore
            }
          }
        }
        return;
      }

      if (payload.type === 'presence') {
        setOnlineUsers(new Set(payload.user_ids.map((id) => String(id))));
        return;
      }

      if (payload.type === 'reaction') {
        setMessages((prev) => {
          const room = payload.room;
          const roomMessages = prev[room] ?? [];
          const updated = roomMessages.map((msg) => {
            if (msg.id !== payload.message_id) return msg;
            if (payload.reactions) {
              return { ...msg, reactions: payload.reactions };
            }
            if (payload.emoji && payload.user_id) {
              const next = { ...(msg.reactions ?? {}) } as Record<string, string[]>;
              for (const [key, users] of Object.entries(next)) {
                next[key] = users.filter((id) => id !== payload.user_id);
                if (next[key].length === 0) {
                  delete next[key];
                }
              }
              const current = next[payload.emoji] ?? [];
              next[payload.emoji] = [...current, payload.user_id];
              return { ...msg, reactions: next };
            }
            return msg;
          });
          return { ...prev, [room]: updated };
        });
        return;
      }

      if (payload.type === 'message_updated') {
        setMessages((prev) => ({
          ...prev,
          [payload.room]: (prev[payload.room] ?? []).map((msg) =>
            msg.id === payload.message_id ? { ...msg, content: payload.content } : msg
          ),
        }));
        return;
      }

      if (payload.type === 'message_deleted') {
        setMessages((prev) => ({
          ...prev,
          [payload.room]: (prev[payload.room] ?? []).filter((msg) => msg.id !== payload.message_id),
        }));
        return;
      }

      if (payload.type === 'group' || payload.type === 'direct') {
        const room = payload.room;
        setHiddenRooms((prev) => {
          if (!prev.has(room)) return prev;
          const next = new Set(prev);
          next.delete(room);
          return next;
        });
        setRooms((prev) => {
          if (prev.find((item) => item.id === room)) return prev;
          const currentUserId = userIdRef.current;
          if (payload.type === 'direct' && currentUserId && room.startsWith('dm:')) {
            const parts = room.split(':');
            if (parts.length >= 3) {
              const a = parts[1];
              const b = parts[2];
              const targetId = currentUserId === a ? b : a;
              const label = userNameMap.get(targetId) ?? targetId.slice(0, 8);
              return [
                ...prev,
                { id: room, label, kind: 'direct', targetId },
              ];
            }
          }
          if (payload.type === 'group') {
            return [
              ...prev,
              { id: room, label: room.replace('group:', ''), kind: 'group' },
            ];
          }
          return prev;
        });
        const messageId = payload.message_id ?? `${payload.from}-${payload.sent_at}`;
        const message: ChatMessage = {
          id: messageId,
          room_key: room,
          sender: payload.from,
          content: payload.content,
          kind: payload.kind,
          sent_at: payload.sent_at,
          reply_to_id: payload.reply_to_id,
          reply_to_content: payload.reply_to_content,
          reply_to_sender: payload.reply_to_sender,
          reactions: payload.reactions,
        };
        setMessages((prev) => {
          const existing = prev[room] ?? [];
          if (existing.some((msg) => msg.id === message.id)) {
            return prev;
          }
          const currentUserId = userIdRef.current;
          if (payload.message_id && payload.from === currentUserId) {
            const next = existing.filter(
              (msg) =>
                !(msg.id.startsWith('local-') && msg.content === payload.content && msg.sender === currentUserId)
            );
            return { ...prev, [room]: [...next, message].slice(-200) };
          }
          return { ...prev, [room]: [...existing, message].slice(-200) };
        });

        if (room === activeRoomRef.current && payload.from !== userIdRef.current) {
          chatService.markRead(room, payload.sent_at).catch(() => undefined);
          if (userIdRef.current) {
            setReadReceipts((prev) => {
              const next = { ...prev };
              const existing = next[room] ?? [];
              const updated = existing.filter((receipt) => receipt.user !== userIdRef.current);
              updated.push({ user: userIdRef.current, last_read_at: payload.sent_at });
              next[room] = updated;
              return next;
            });
          }
          socketRef.current?.send(
            JSON.stringify({
              type: 'read',
              room,
              last_read_at: payload.sent_at,
            })
          );
          setUnreadByRoom((prev) => ({ ...prev, [room]: 0 }));
        } else if (payload.from !== userIdRef.current) {
          setUnreadByRoom((prev) => ({
            ...prev,
            [room]: (prev[room] ?? 0) + 1,
          }));
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!wsBaseUrl) return;
    let isMounted = true;
    chatService
      .getWsToken()
      .then((token) => {
        if (isMounted) setWsToken(token);
      })
      .catch(() => {
        if (isMounted) setWsToken('');
      })
      .finally(() => {
        if (isMounted) setWsReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, [wsBaseUrl]);

  useEffect(() => {
    if (!wsUrl || !wsReady) return;
    setStatus('connecting');
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      // join all known rooms so unread badges update in real time
      rooms.forEach((room) => {
        socket.send(JSON.stringify({ type: 'join', room: room.id }));
      });
    };
    socket.onclose = () => setStatus('disconnected');
    socket.onerror = () => setStatus('disconnected');
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as IncomingMessage;
        handleIncoming(payload);
      } catch {
        // ignore malformed message
      }
    };

    return () => {
      socket.close();
    };
  }, [handleIncoming, wsReady, wsUrl, rooms]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    rooms.forEach((room) => {
      socket.send(JSON.stringify({ type: 'join', room: room.id }));
    });
  }, [rooms]);

  const loadRoomMessages = useCallback(
    async (roomId: string) => {
      try {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'join', room: roomId }));
        }
        const data = await chatService.getMessages(roomId, { limit: 30 });
        const roomMessages = data.messages.map((message) => ({
          ...message,
          room_key: message.room_key ?? roomId,
          sender: message.sender,
        }));
        setMessages((prev) => ({
          ...prev,
          [roomId]: roomMessages,
        }));
        setUnreadByRoom((prev) => ({ ...prev, [roomId]: 0 }));
        setReadReceipts((prev) => ({
          ...prev,
          [roomId]: data.read_receipts ?? [],
        }));
        setRoomPagination((prev) => ({
          ...prev,
          [roomId]: {
            hasMore: Boolean(data.has_more),
            nextBefore: data.next_before ?? null,
            loading: false,
          },
        }));

        const lastMessage = roomMessages[roomMessages.length - 1];
        if (lastMessage) {
          await chatService.markRead(roomId, lastMessage.sent_at);
          if (chatContext?.id) {
            setReadReceipts((prev) => {
              const next = { ...prev };
              const existing = next[roomId] ?? [];
              const updated = existing.filter((receipt) => receipt.user !== chatContext.id);
              updated.push({ user: chatContext.id, last_read_at: lastMessage.sent_at });
              next[roomId] = updated;
              return next;
            });
          }
          socketRef.current?.send(
            JSON.stringify({
              type: 'read',
              room: roomId,
              last_read_at: lastMessage.sent_at,
            })
          );
          if (typeof window !== 'undefined') {
            try {
              const raw = window.localStorage.getItem('chat_unread_rooms');
              if (raw) {
                const parsed = JSON.parse(raw) as string[];
                const next = Array.isArray(parsed) ? parsed.filter((roomKey) => roomKey !== roomId) : [];
                window.localStorage.setItem('chat_unread_rooms', JSON.stringify(next));
              }
            } catch {
              // ignore
            }
          }
        }
        requestAnimationFrame(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      } catch (error) {
        showToast({ title: 'Chat error', description: 'Unable to load messages.', variant: 'error' });
      }
    },
    [showToast, chatContext?.id]
  );

  const loadOlderMessages = useCallback(
    async (roomId: string) => {
      const pagination = roomPagination[roomId];
      if (!pagination || !pagination.hasMore || pagination.loading) return;
      setRoomPagination((prev) => ({
        ...prev,
        [roomId]: { ...pagination, loading: true },
      }));
      const container = messagesContainerRef.current;
      const prevHeight = container?.scrollHeight ?? 0;
      const prevScrollTop = container?.scrollTop ?? 0;
      loadingOlderRef.current = true;
      try {
        const data = await chatService.getMessages(roomId, {
          limit: 30,
          before: pagination.nextBefore,
        });
        setMessages((prev) => {
          const existing = prev[roomId] ?? [];
          const existingIds = new Set(existing.map((msg) => msg.id));
          const older = data.messages.filter((msg) => !existingIds.has(msg.id));
          return {
            ...prev,
            [roomId]: [...older, ...existing],
          };
        });
        setRoomPagination((prev) => ({
          ...prev,
          [roomId]: {
            hasMore: Boolean(data.has_more),
            nextBefore: data.next_before ?? null,
            loading: false,
          },
        }));
      } catch {
        setRoomPagination((prev) => ({
          ...prev,
          [roomId]: { ...pagination, loading: false },
        }));
      } finally {
        requestAnimationFrame(() => {
          const containerAfter = messagesContainerRef.current;
          if (containerAfter) {
            const newHeight = containerAfter.scrollHeight;
            containerAfter.scrollTop = prevScrollTop + (newHeight - prevHeight);
          }
          loadingOlderRef.current = false;
        });
      }
    },
    [roomPagination]
  );

  useEffect(() => {
    if (!activeRoom) return;
    activeRoomRef.current = activeRoom;
    loadRoomMessages(activeRoom);
  }, [activeRoom, loadRoomMessages]);

  useEffect(() => {
    userIdRef.current = chatContext?.id ?? null;
  }, [chatContext?.id]);

  const sendTypingEvent = (isTyping: boolean) => {
    if (!activeRoom) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'typing', room: activeRoom, is_typing: isTyping }));
  };

  const handleSend = () => {
    if (!activeRoom || !messageInput.trim()) return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showToast({ title: 'Not connected', description: 'Chat server is offline.', variant: 'error' });
      return;
    }

    const room = rooms.find((item) => item.id === activeRoom);
    const content = messageInput.trim();

    if (room?.kind === 'direct' && room.targetId) {
      socket.send(
        JSON.stringify({
          type: 'direct',
          to: room.targetId,
          content,
          reply_to_id: replyTarget?.id ?? null,
          reply_to_content: replyTarget?.content ?? null,
          reply_to_sender: replyTarget
            ? userNameMap.get(replyTarget.sender) ?? replyTarget.sender.slice(0, 8)
            : null,
        })
      );
    } else {
      socket.send(
        JSON.stringify({
          type: 'group',
          room: activeRoom,
          content,
          reply_to_id: replyTarget?.id ?? null,
          reply_to_content: replyTarget?.content ?? null,
          reply_to_sender: replyTarget
            ? userNameMap.get(replyTarget.sender) ?? replyTarget.sender.slice(0, 8)
            : null,
        })
      );
    }

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      room_key: activeRoom,
      sender: chatContext?.id ?? 'me',
      content,
      sent_at: new Date().toISOString(),
      reply_to_id: replyTarget?.id ?? null,
      reply_to_content: replyTarget?.content ?? null,
      reply_to_sender: replyTarget
        ? userNameMap.get(replyTarget.sender) ?? replyTarget.sender.slice(0, 8)
        : null,
    };

    setMessages((prev) => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] ?? []), optimistic].slice(-200),
    }));
    setMessageInput('');
    setReplyTarget(null);
    sendTypingEvent(false);
  };

  const handleReact = (roomId: string, messageId: string, emoji: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      chatService.reactToMessage(messageId, emoji).catch(() => undefined);
      return;
    }
    socket.send(JSON.stringify({ type: 'reaction', room: roomId, message_id: messageId, emoji }));
  };

  const openConfirm = (title: string, description: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmDescription(description);
    confirmActionRef.current = action;
    setConfirmOpen(true);
  };

  const performDeleteConversation = async (roomId: string) => {
    try {
      await chatService.deleteConversation(roomId);
      setHiddenRooms((prev) => {
        const next = new Set(prev);
        next.add(roomId);
        return next;
      });
      setRooms((prev) => prev.filter((item) => item.id !== roomId));
      setUnreadByRoom((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setMessages((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setReadReceipts((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      if (activeRoom === roomId) {
        setActiveRoom('');
      }
    } catch {
      setHiddenRooms((prev) => {
        const next = new Set(prev);
        next.add(roomId);
        return next;
      });
      setRooms((prev) => prev.filter((item) => item.id !== roomId));
      setUnreadByRoom((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      showToast({ title: 'Chat error', description: 'Conversation hidden locally.', variant: 'error' });
    }
  };

  const handleDeleteConversation = (roomId: string) => {
    if (roomId.startsWith('section:')) {
      showToast({ title: 'Not allowed', description: 'Section group chats cannot be deleted.', variant: 'error' });
      return;
    }
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;
    openConfirm(
      'Delete conversation',
      `Delete conversation with "${room.label}"? This cannot be undone.`,
      () => performDeleteConversation(roomId)
    );
  };

  const performEditMessage = async (message: ChatMessage, nextValue: string) => {
    if (message.sender !== chatContext?.id) return;
    if (message.content === UNSENT_TOKEN) return;
    if (message.id.startsWith('local-')) {
      showToast({ title: 'Please wait', description: 'Message is still sending.', variant: 'error' });
      return;
    }
    const trimmed = nextValue.trim();
    if (!trimmed) return;
    try {
      const socket = socketRef.current;
      await chatService.updateMessage(message.id, trimmed);
      setMessages((prev) => ({
        ...prev,
        [activeRoom]: (prev[activeRoom] ?? []).map((msg) =>
          msg.id === message.id ? { ...msg, content: trimmed } : msg
        ),
      }));
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'edit_message',
            room: activeRoom,
            message_id: message.id,
            content: trimmed,
          })
        );
      }
    } catch {
      showToast({ title: 'Chat error', description: 'Unable to update message.', variant: 'error' });
    }
  };

  const handleEditMessage = (message: ChatMessage) => {
    if (message.sender !== chatContext?.id) return;
    if (message.content === UNSENT_TOKEN) return;
    setEditTarget(message);
    setEditValue(message.content);
    setEditOpen(true);
  };

  const performDeleteMessage = async (message: ChatMessage) => {
    if (message.sender !== chatContext?.id) return;
    if (message.id.startsWith('local-')) {
      showToast({ title: 'Please wait', description: 'Message is still sending.', variant: 'error' });
      return;
    }
    try {
      const socket = socketRef.current;
      setMessages((prev) => ({
        ...prev,
        [activeRoom]: (prev[activeRoom] ?? []).map((msg) =>
          msg.id === message.id ? { ...msg, content: UNSENT_TOKEN } : msg
        ),
      }));
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'edit_message',
            room: activeRoom,
            message_id: message.id,
            content: UNSENT_TOKEN,
          })
        );
      }
      await chatService.updateMessage(message.id, UNSENT_TOKEN);
    } catch {
      showToast({ title: 'Chat error', description: 'Unable to delete message.', variant: 'error' });
    }
  };

  const handleDeleteMessage = (message: ChatMessage) => {
    if (message.sender !== chatContext?.id) return;
    openConfirm(
      'Delete for everyone',
      'This will unsend the message for everyone.',
      () => performDeleteMessage(message)
    );
  };

  const handleDeleteForMe = (message: ChatMessage) => {
    setMessages((prev) => ({
      ...prev,
      [activeRoom]: (prev[activeRoom] ?? []).filter((msg) => msg.id !== message.id),
    }));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (groupMembersRef.current.length === 0) {
      showToast({ title: 'Add members', description: 'Select at least one member for this group.', variant: 'error' });
      return;
    }
    try {
      const group = await chatService.createGroup(groupName.trim(), groupMembersRef.current);
      const label = group.name?.trim() || group.room_key.replace('group:', '');
      setGroupMetaByRoom((prev) => ({
        ...prev,
        [group.room_key]: { createdBy: group.created_by ?? chatContext?.id ?? null },
      }));
      setRooms((prev) => {
        if (prev.find((room) => room.id === group.room_key)) return prev;
        return [...prev, { id: group.room_key, label, kind: 'group' }];
      });
      setActiveRoom(group.room_key);
      setGroupName('');
      setGroupMemberIds([]);
      setGroupMemberQuery('');
      setGroupDialogOpen(false);
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'join', room: group.room_key }));
      }
    } catch {
      showToast({ title: 'Chat error', description: 'Unable to create group.', variant: 'error' });
    }
  };

  const handleAddMembers = async () => {
    if (!addMembersRoomId) return;
    if (addMemberIds.length === 0) {
      showToast({ title: 'Add members', description: 'Select at least one member to add.', variant: 'error' });
      return;
    }
    try {
      await chatService.addGroupMembers(addMembersRoomId, addMemberIds);
      const addedNames = addMemberIds.map((id) => allUserNameMap.get(id) ?? id.slice(0, 8));
      const actorName = allUserNameMap.get(chatContext?.id ?? '') ?? 'Someone';
      const systemLine =
        addedNames.length > 1
          ? `${actorName} added ${addedNames.join(', ')} to the group.`
          : `${actorName} added ${addedNames[0]} to the group.`;
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'group', room: addMembersRoomId, content: systemLine }));
      }
      showToast({ title: 'Members added', description: 'The group has been updated.', variant: 'success' });
      setAddMemberIds([]);
      setAddMemberQuery('');
      setExistingGroupMembers((prev) => Array.from(new Set([...prev, ...addMemberIds])));
      setAddMembersOpen(false);
    } catch {
      showToast({ title: 'Chat error', description: 'Unable to add members.', variant: 'error' });
    }
  };

  const handleLeaveGroup = async (roomId: string) => {
    try {
      await chatService.leaveGroup(roomId);
      const actorName = allUserNameMap.get(chatContext?.id ?? '') ?? 'Someone';
      const systemLine = `${actorName} left the group.`;
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'group', room: roomId, content: systemLine }));
      }
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      setUnreadByRoom((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
      if (activeRoom === roomId) {
        setActiveRoom('');
      }
      showToast({ title: 'Left group', description: 'You left the group chat.', variant: 'success' });
    } catch {
      showToast({ title: 'Chat error', description: 'Unable to leave group.', variant: 'error' });
    }
  };

  const activeMessages = messages[activeRoom] ?? [];
  const activeRoomInfo = rooms.find((room) => room.id === activeRoom) ?? null;
  const activeRoomTargetId = activeRoomInfo
    ? getDirectTargetId(activeRoomInfo, chatContext?.id)
    : null;
  const activeRoomAvatar =
    activeRoomInfo?.kind === 'direct' && activeRoomTargetId
      ? userAvatarMap.get(activeRoomTargetId) ?? null
      : null;
  const activeMessageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    activeMessages.forEach((message) => {
      map.set(message.id, message);
    });
    return map;
  }, [activeMessages]);
  const activeTyping = typingByRoom[activeRoom] ?? new Set();
  const typingNames = Array.from(activeTyping)
    .filter((id) => id !== chatContext?.id)
    .map((id) => userNameMap.get(id) ?? id.slice(0, 8));

  const activeReadReceipts = readReceipts[activeRoom] ?? [];
  const readReceiptMap = useMemo(() => {
    const map = new Map<string, string>();
    activeReadReceipts.forEach((receipt) => {
      map.set(receipt.user, receipt.last_read_at);
    });
    return map;
  }, [activeReadReceipts]);

  const lastSeenMessageByUser = useMemo(() => {
    const map = new Map<string, string>();
    if (activeMessages.length === 0) return map;
    const sorted = [...activeMessages].sort(
      (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
    activeReadReceipts.forEach((receipt) => {
      const lastReadTime = new Date(receipt.last_read_at).getTime();
      let lastSeenMessageId: string | null = null;
      for (const msg of sorted) {
        if (new Date(msg.sent_at).getTime() <= lastReadTime) {
          lastSeenMessageId = msg.id;
        } else {
          break;
        }
      }
      if (lastSeenMessageId) {
        map.set(receipt.user, lastSeenMessageId);
      }
    });
    return map;
  }, [activeMessages, activeReadReceipts]);

  const lastMessageByRoom = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    Object.entries(messages).forEach(([roomId, roomMessages]) => {
      if (roomMessages.length) {
        map.set(roomId, roomMessages[roomMessages.length - 1]);
      }
    });
    return map;
  }, [messages]);

  const filteredGroupMembers = useMemo(() => {
    const query = groupMemberQuery.trim().toLowerCase();
    const base = allUsersData.length ? allUsersData : contacts;
    const filtered = base.filter((user) => {
      if (user.id === chatContext?.id) return false;
      if (!query) return true;
      return (
        user.full_name.toLowerCase().includes(query)
        || user.role.toLowerCase().includes(query)
      );
    });
    return filtered.slice(0, 25);
  }, [allUsersData, contacts, groupMemberQuery, chatContext?.id]);

  const filteredAddMembers = useMemo(() => {
    const query = addMemberQuery.trim().toLowerCase();
    const base = allUsersData.length ? allUsersData : contacts;
    const filtered = base.filter((user) => {
      if (user.id === chatContext?.id) return false;
      if (existingGroupMembers.includes(user.id)) return false;
      if (!query) return true;
      return (
        user.full_name.toLowerCase().includes(query)
        || user.role.toLowerCase().includes(query)
      );
    });
    return filtered.slice(0, 25);
  }, [allUsersData, contacts, addMemberQuery, chatContext?.id, existingGroupMembers]);

  const getReadStatus = (message: ChatMessage) => {
    if (!chatContext?.id) return '';
    if (message.sender !== chatContext.id) return '';

    const others = activeReadReceipts.filter((receipt) => receipt.user !== chatContext.id);
    if (others.length === 0) return '';

    const read = others.some((receipt) => new Date(receipt.last_read_at) >= new Date(message.sent_at));
    return read ? 'Read' : 'Delivered';
  };

  const getSeenUsers = (message: ChatMessage) => {
    return Array.from(lastSeenMessageByUser.entries())
      .filter(([, messageId]) => messageId === message.id)
      .map(([userId]) => userId);
  };

  const getSeenNames = (message: ChatMessage) => {
    return getSeenUsers(message).map((userId) => userNameMap.get(userId) ?? userId.slice(0, 8));
  };

  const getUnreadCount = (roomId: string) => {
    if (typeof unreadByRoom[roomId] === 'number' && unreadByRoom[roomId] > 0) {
      return unreadByRoom[roomId];
    }
    if (!chatContext?.id) return 0;
    const roomMessages = messages[roomId] ?? [];
    if (roomMessages.length === 0) return 0;
    const receipts = readReceipts[roomId] ?? [];
    const mine = receipts.find((receipt) => receipt.user === chatContext.id);
    if (!mine) {
      return roomMessages.filter((msg) => msg.sender !== chatContext.id).length;
    }
    const lastRead = new Date(mine.last_read_at).getTime();
    return roomMessages.filter(
      (msg) =>
        msg.sender !== chatContext.id &&
        new Date(msg.sent_at).getTime() > lastRead
    ).length;
  };

  const baseRooms = useMemo(() => {
    const unique = new Map<string, Room>();
    rooms.forEach((room) => {
      if (room.id.startsWith('section:') || room.kind === 'section') return;
      const unreadCount = unreadByRoom[room.id] ?? 0;
      if (hiddenRooms.has(room.id) && unreadCount === 0) return;
      unique.set(room.id, room);
    });

    Object.entries(unreadByRoom).forEach(([roomId, count]) => {
      if (count <= 0) return;
      if (roomId.startsWith('section:')) return;
      if (unique.has(roomId)) return;
      if (roomId.startsWith('dm:') && chatContext?.id) {
        const parts = roomId.split(':');
        if (parts.length >= 3) {
          const a = parts[1];
          const b = parts[2];
          const targetId = chatContext.id === a ? b : a;
          const label = userNameMap.get(targetId) ?? targetId.slice(0, 8);
          unique.set(roomId, { id: roomId, label, kind: 'direct', targetId });
        }
      } else if (roomId.startsWith('group:')) {
        unique.set(roomId, { id: roomId, label: roomId.replace('group:', ''), kind: 'group' });
      }
    });

    return Array.from(unique.values());
  }, [rooms, hiddenRooms, unreadByRoom, chatContext?.id, userNameMap]);

  const displayedRooms = useMemo(() => {
    const query = roomSearch.trim().toLowerCase();
    if (query) {
      const merged = new Map<string, Room>();
      baseRooms.forEach((room) => merged.set(room.id, room));
      searchResults.forEach((room) => merged.set(room.id, room));
      return Array.from(merged.values()).filter((room) =>
        room.label.toLowerCase().includes(query)
      );
    }

    return baseRooms;
  }, [baseRooms, roomSearch, searchResults]);

  const visibleRooms = useMemo(() => {
    return displayedRooms.slice(0, roomListLimit);
  }, [displayedRooms, roomListLimit]);


  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (loadingOlderRef.current) return;
    const lastMessage = activeMessages[activeMessages.length - 1];
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isAtBottom || lastMessage?.sender === chatContext?.id) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [activeMessages.length, activeRoom, chatContext?.id]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-chat-menu]')) {
        return;
      }
      setRoomMenuOpenId(null);
      setMessageMenuOpenId(null);
    };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card
        className={`border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm lg:w-[340px] lg:shrink-0 ${
          showChat ? 'hidden lg:block' : 'block'
        }`}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Messenger</CardTitle>
            <Badge variant="outline" className="uppercase tracking-[0.2em] text-[10px]">
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] px-3 py-2 text-xs text-neutral-500">
            <Search className="h-3 w-3" />
            <input
              value={roomSearch}
              onChange={(event) => setRoomSearch(event.target.value)}
              placeholder="Search people or groups"
              className="w-full bg-transparent text-xs text-neutral-600 placeholder:text-neutral-400 outline-none"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            {roomSearch.trim() ? 'Search Results' : 'Chats'}
          </div>
          {!roomSearch.trim() && displayedRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] px-4 py-6 text-xs text-neutral-500">
              Start typing a name to search and begin a chat.
            </div>
          ) : null}
          {visibleRooms
            .filter((room) =>
              room.label.toLowerCase().includes(roomSearch.toLowerCase().trim())
            )
            .map((room) => {
            const lastMessage = lastMessageByRoom.get(room.id);
            const unreadCount = getUnreadCount(room.id);
            const isUnread = unreadCount > 0;
            const targetId = getDirectTargetId(room, chatContext?.id);
            const isOnline =
              room.kind === 'direct' && targetId
                ? onlineUsers.has(String(targetId))
                : false;
            return (
              <div
                key={room.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setRooms((prev) => {
                    if (prev.find((item) => item.id === room.id)) return prev;
                    return [...prev, room];
                  });
                  setActiveRoom(room.id);
                  setShowChat(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setRooms((prev) => {
                      if (prev.find((item) => item.id === room.id)) return prev;
                      return [...prev, room];
                    });
                    setActiveRoom(room.id);
                    setShowChat(true);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  activeRoom === room.id
                    ? 'bg-[var(--brand-blue-muted)] text-[var(--brand-blue-deep)]'
                    : isUnread
                    ? 'bg-rose-50/60 text-neutral-900 hover:bg-rose-100/60'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-blue)] text-sm font-semibold text-white">
                  {room.kind === 'direct' && targetId && userAvatarMap.get(targetId) ? (
                    <img
                      src={userAvatarMap.get(targetId) ?? undefined}
                      alt={room.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{room.label.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className={`truncate text-sm ${isUnread ? 'font-semibold text-neutral-900' : 'font-medium'}`}>
                      {room.label}
                    </div>
                    <div className="flex items-center gap-2">
                      {room.kind === 'direct' ? (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOnline ? 'bg-emerald-500' : 'bg-neutral-300'
                          }`}
                          title={isOnline ? 'Online' : 'Offline'}
                        />
                      ) : null}
                      {lastMessage ? (
                        <span className="text-[10px] text-neutral-400">
                          {new Date(lastMessage.sent_at).toLocaleTimeString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={`truncate text-xs ${isUnread ? 'font-semibold text-neutral-700' : 'text-neutral-500'}`}>
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                    {room.kind}
                  </div>
                </div>
                {roomSearch.trim() ? null : unreadCount > 0 ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-semibold text-white">
                    {Math.min(unreadCount, 9)}
                    {unreadCount > 9 ? '+' : ''}
                  </div>
                ) : null}
                <div className="relative" data-chat-menu>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRoomMenuOpenId((prev) => (prev === room.id ? null : room.id));
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="rounded-full p-2 text-neutral-400 hover:bg-neutral-200"
                    aria-label="Chat actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {roomMenuOpenId === room.id ? (
                    <div
                      className="absolute right-0 top-9 z-10 w-44 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-1 text-xs shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      {room.kind === 'group' ? (
                        <>
                          {groupMetaByRoom[room.id]?.createdBy === chatContext?.id ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setRoomMenuOpenId(null);
                                setAddMembersRoomId(room.id);
                                chatService
                                  .getGroupMembers(room.id)
                                  .then((members) => {
                                    setExistingGroupMembers(members.map((member) => member.id));
                                  })
                                  .catch(() => setExistingGroupMembers([]))
                                  .finally(() => setAddMembersOpen(true));
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100"
                            >
                              Add members
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRoomMenuOpenId(null);
                              handleLeaveGroup(room.id);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                          >
                            Leave group
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setRoomMenuOpenId(null);
                          handleDeleteConversation(room.id);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                      >
                        Delete conversation
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {displayedRooms.length > roomListLimit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRoomListLimit((prev) => prev + 10)}
            >
              Load more
            </Button>
          ) : null}
          <div className="space-y-2 border-t border-[rgba(15,23,42,0.08)] pt-3">
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">New group</div>
            <Button size="sm" onClick={() => setGroupDialogOpen(true)}>
              Create group
            </Button>
          </div>
        </CardContent>
      </Card>

        <Card
          className={`border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm lg:flex-1 ${
            showChat ? 'block' : 'hidden lg:block'
          }`}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            setTouchStartX(touch.clientX);
            setTouchStartY(touch.clientY);
          }}
          onTouchEnd={(event) => {
            if (touchStartX === null || touchStartY === null) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            if (dx > 80 && Math.abs(dx) > Math.abs(dy)) {
              setShowChat(false);
            }
            setTouchStartX(null);
            setTouchStartY(null);
          }}
        >
        <CardHeader className="border-b border-[rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="rounded-full border border-[rgba(15,23,42,0.08)] bg-white p-2 text-neutral-500 shadow-sm lg:hidden"
                aria-label="Back to chats"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-blue)] text-sm font-semibold text-white">
                {activeRoomInfo?.kind === 'direct' && activeRoomTargetId && userAvatarMap.get(activeRoomTargetId) ? (
                  <img
                    src={userAvatarMap.get(activeRoomTargetId) ?? undefined}
                    alt={activeRoomInfo?.label ?? 'Chat'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (activeRoomInfo?.label ?? 'C').slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <CardTitle>{activeRoomInfo?.label ?? 'Chat'}</CardTitle>
                <div className="text-xs text-neutral-400">
                  {activeRoomInfo?.kind === 'direct' && activeRoomTargetId ? (
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          onlineUsers.has(String(activeRoomTargetId)) ? 'bg-emerald-500' : 'bg-neutral-300'
                        }`}
                      />
                      {onlineUsers.has(String(activeRoomTargetId)) ? 'Online' : 'Offline'} • {status}
                    </span>
                  ) : (
                    <>Online • {status}</>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-neutral-500" />
          </div>
        </CardHeader>
        <CardContent className="flex h-[68vh] flex-col">
          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto bg-[var(--surface-2)] px-6 py-5"
            onScroll={() => {
              const container = messagesContainerRef.current;
              if (!container) return;
              if (container.scrollTop < 120) {
                loadOlderMessages(activeRoom);
              }
            }}
          >
            {roomPagination[activeRoom]?.loading ? (
              <div className="text-center text-xs text-neutral-400">Loading earlier messages…</div>
            ) : null}
            {roomPagination[activeRoom]?.hasMore ? (
              <button
                type="button"
                onClick={() => loadOlderMessages(activeRoom)}
                className="mx-auto block rounded-full border border-[rgba(15,23,42,0.12)] bg-white px-3 py-1 text-[11px] text-neutral-500"
              >
                Load earlier messages
              </button>
            ) : null}
            {activeMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-neutral-500">
                {activeRoomAvatar ? (
                  <img
                    src={activeRoomAvatar}
                    alt={activeRoomInfo?.label ?? 'Chat'}
                    className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
                    <User className="h-6 w-6 text-neutral-500" />
                  </div>
                )}
                <div className="text-base font-semibold text-neutral-700">
                  {activeRoomInfo?.label ?? 'Chat'}
                </div>
                <div>No messages yet. Start the conversation when you’re ready.</div>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMine = msg.sender === chatContext?.id;
                const readStatus = getReadStatus(msg);
                const replyMessage = msg.reply_to_id ? activeMessageMap.get(msg.reply_to_id) : null;
                const reactions = msg.reactions ?? {};
                const isUnsent = msg.content === UNSENT_TOKEN;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`group relative max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isMine
                          ? 'bg-[var(--brand-blue-deep)] text-white'
                          : 'bg-white text-neutral-700'
                      }`}
                      onTouchStart={(event) => {
                        const touch = event.touches[0];
                        setBubbleSwipeStart(touch.clientX);
                      }}
                      onTouchEnd={(event) => {
                        if (bubbleSwipeStart === null) return;
                        const touch = event.changedTouches[0];
                        const dx = touch.clientX - bubbleSwipeStart;
                        if (dx > 60) {
                          setReplyTarget(msg);
                        }
                        setBubbleSwipeStart(null);
                      }}
                    >
                      {!isUnsent ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMessageMenuOpenId((prev) => (prev === msg.id ? null : msg.id));
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`absolute right-2 top-2 z-30 rounded-full p-1 shadow-sm ${
                          isMine
                            ? 'bg-black/30 text-white/80 hover:bg-black/40'
                            : 'bg-white/90 text-neutral-500 hover:bg-white'
                        }`}
                        aria-label="Message actions"
                        data-chat-menu
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                      ) : null}
                      {messageMenuOpenId === msg.id && !isUnsent ? (
                        <div
                          className="absolute right-2 top-8 z-20 w-44 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-1 text-xs text-neutral-700 shadow-lg"
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                          data-chat-menu
                        >
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setMessageMenuOpenId(null);
                                setReactionPickerMessageId((prev) => (prev === msg.id ? null : msg.id));
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100 lg:hidden"
                            >
                              React
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMessageMenuOpenId(null);
                                setReplyTarget(msg);
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100 lg:hidden"
                            >
                              Reply
                            </button>
                            {isMine ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessageMenuOpenId(null);
                                    handleEditMessage(msg);
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100"
                                >
                                  Edit message
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMessageMenuOpenId(null);
                                    handleDeleteMessage(msg);
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left text-rose-500 hover:bg-rose-50"
                                >
                                  Delete for everyone
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                setMessageMenuOpenId(null);
                                handleDeleteForMe(msg);
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left hover:bg-neutral-100"
                            >
                              Delete for me
                            </button>
                          </>
                        </div>
                      ) : null}
                      {!isUnsent && (replyMessage || msg.reply_to_content) ? (
                        <div className="mb-2 rounded-xl border-l-4 border-emerald-400 bg-white/90 px-3 py-2 text-[12px] text-neutral-700 shadow-sm">
                          <span className="font-semibold">Replied:</span>{' '}
                          <span className="font-medium">
                            {msg.reply_to_content ?? replyMessage?.content ?? 'Message'}
                          </span>
                        </div>
                      ) : null}
                      <div className="text-[11px] opacity-70">
                        {isMine ? 'You' : userNameMap.get(msg.sender) ?? msg.sender.slice(0, 8)}
                      </div>
                      <div>
                        {isUnsent
                          ? isMine
                            ? 'You unsent a message.'
                            : `${userNameMap.get(msg.sender) ?? 'User'} unsent a message.`
                          : msg.content}
                      </div>
                      <div className="mt-1 text-[10px] opacity-60">
                        {new Date(msg.sent_at).toLocaleTimeString()}
                        {readStatus ? ` • ${readStatus}` : ''}
                      </div>
                      {!isUnsent ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {Object.entries(reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReact(activeRoom, msg.id, emoji)}
                              className={`rounded-full border px-2 py-1 text-[11px] ${
                                users.includes(chatContext?.id ?? '')
                                  ? 'border-emerald-400 text-emerald-600'
                                  : 'border-transparent bg-white/70'
                              }`}
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setReactionPickerMessageId((prev) => (prev === msg.id ? null : msg.id))
                            }
                            className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                      {!isUnsent && reactionPickerMessageId === msg.id ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                handleReact(activeRoom, msg.id, emoji);
                                setReactionPickerMessageId(null);
                              }}
                              className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {!isUnsent ? (
                        <div className="mt-2 hidden items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 lg:flex">
                          <button
                            type="button"
                            onClick={() => setReplyTarget(msg)}
                            className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                          >
                            Reply
                          </button>
                          {isMine ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditMessage(msg)}
                                className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg)}
                                className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                              >
                                Delete for everyone
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteForMe(msg)}
                                className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                              >
                                Delete for me
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteForMe(msg)}
                              className="rounded-full border border-white/40 px-2 py-1 text-[11px]"
                            >
                              Delete for me
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {getSeenUsers(msg).length > 0 ? (
                      <div className="mt-1 flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setSeenPopoverMessageId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          className="flex items-center gap-1"
                          aria-label="Seen by"
                        >
                          {getSeenUsers(msg).map((userId) => (
                            <div key={userId} className="flex items-center">
                              {userAvatarMap.get(userId) ? (
                                <img
                                  src={userAvatarMap.get(userId) ?? undefined}
                                  alt={userNameMap.get(userId) ?? 'Seen'}
                                  className="h-4 w-4 rounded-full border border-neutral-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-200 bg-neutral-200">
                                  <User className="h-2.5 w-2.5 text-neutral-500" />
                                </div>
                              )}
                            </div>
                          ))}
                        </button>
                        {seenPopoverMessageId === msg.id ? (
                          <div className="max-w-[240px] rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 py-2 text-[11px] text-neutral-600 shadow-sm">
                            <span className="font-semibold text-neutral-700">Seen by:</span>{' '}
                            {getSeenNames(msg).join(', ')}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
            {typingNames.length > 0 && (
              <div className="flex flex-col items-start gap-2">
                <div className="text-[11px] text-neutral-500">{typingNames.join(', ')} typing…</div>
                <div className="inline-flex items-center gap-1 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-3 py-2 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-[rgba(15,23,42,0.08)] bg-white px-4 py-4">
            {replyTarget ? (
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] px-4 py-2 text-xs text-neutral-600">
                <div className="truncate">
                  Replying to {replyTarget.sender === chatContext?.id ? 'you' : userNameMap.get(replyTarget.sender) ?? replyTarget.sender.slice(0, 8)}: {replyTarget.content}
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="ml-3 text-[11px] text-neutral-400"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            <div className="flex gap-2">
            <Input
              placeholder={activeRoom ? 'Type a message…' : 'Select a room to start chatting'}
              value={messageInput}
              onChange={(event) => {
                setMessageInput(event.target.value);
                sendTypingEvent(true);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => sendTypingEvent(false), 1500);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSend();
              }}
              disabled={!activeRoom}
            />
            <Button onClick={handleSend} disabled={!activeRoom || !messageInput.trim()}>
              Send
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>{confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                confirmActionRef.current?.();
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
            <DialogDescription>Update your message and save it for everyone.</DialogDescription>
          </DialogHeader>
          <Input
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editTarget) {
                  performEditMessage(editTarget, editValue);
                }
                setEditOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a group chat</DialogTitle>
            <DialogDescription>Pick a name and invite classmates or staff.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Group name</div>
              <Input
                placeholder="Study squad"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400">
                <span>Members</span>
                <span>{groupMemberIds.length} selected</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] px-3 py-2 text-xs text-neutral-500">
                <Search className="h-3 w-3" />
                <input
                  value={groupMemberQuery}
                  onChange={(event) => setGroupMemberQuery(event.target.value)}
                  placeholder="Search students or teachers"
                  className="w-full bg-transparent text-xs text-neutral-600 placeholder:text-neutral-400 outline-none"
                />
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {filteredGroupMembers.map((user) => {
                  const checked = groupMemberIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setGroupMemberIds((prev) =>
                          prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                        );
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs transition ${
                        checked
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-[rgba(15,23,42,0.08)] bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-neutral-800">{user.full_name}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">{user.role}</div>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border ${
                          checked ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGroupDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim()}>
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addMembersOpen}
        onOpenChange={(open) => {
          setAddMembersOpen(open);
          if (!open) {
            setAddMemberIds([]);
            setAddMemberQuery('');
            setExistingGroupMembers([]);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add members</DialogTitle>
            <DialogDescription>Invite more classmates into this group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400">
                <span>Members</span>
                <span>{addMemberIds.length} selected</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] px-3 py-2 text-xs text-neutral-500">
                <Search className="h-3 w-3" />
                <input
                  value={addMemberQuery}
                  onChange={(event) => setAddMemberQuery(event.target.value)}
                  placeholder="Search students or teachers"
                  className="w-full bg-transparent text-xs text-neutral-600 placeholder:text-neutral-400 outline-none"
                />
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {filteredAddMembers.map((user) => {
                  const checked = addMemberIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setAddMemberIds((prev) =>
                          prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                        );
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs transition ${
                        checked
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-[rgba(15,23,42,0.08)] bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-neutral-800">{user.full_name}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">{user.role}</div>
                      </div>
                      <div
                        className={`h-4 w-4 rounded-full border ${
                          checked ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddMembersOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMembers} disabled={addMemberIds.length === 0}>
              Add members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
