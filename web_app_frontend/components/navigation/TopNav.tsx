'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Menu, MessageCircle, Search, ChevronDown, Settings, User, LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChatBadge } from '@/features/chat/hooks/useChatBadge';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import type { Notification, UserRole } from '@/types';

interface TopNavProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onLogout?: () => void;
  userName?: string;
  userAvatarUrl?: string;
  chatHref?: string;
  userRole?: UserRole;
}

function resolveNotificationHref(notification: Notification, role?: UserRole) {
  const isStudent = role === 'student';
  const base = isStudent ? '/dashboard/student' : '/dashboard/teacher';
  if (notification.kind === 'lesson') {
    return `${base}/lessons/${notification.target_id}`;
  }
  if (notification.kind === 'assignment') {
    return `${base}/assignments/${notification.target_id}`;
  }
  if (notification.kind === 'quiz') {
    return `${base}/quizzes`;
  }
  if (notification.kind === 'assignment_submission') {
    return `/dashboard/teacher/assignments/${notification.target_id}`;
  }
  if (notification.kind === 'quiz_submission') {
    return notification.section_subject_id
      ? `/dashboard/teacher/classes/${notification.section_subject_id}`
      : '/dashboard/teacher/quizzes';
  }
  if (notification.kind === 'attendance') {
    if (isStudent) {
      return '/dashboard/student/attendance';
    }
    return '/dashboard/teacher/attendance';
  }
  return base;
}

function resolveNotificationPage(role?: UserRole) {
  if (role === 'student') return '/dashboard/student/notifications';
  if (role === 'teacher' || role === 'instructor' || role === 'adviser') return '/dashboard/teacher/notifications';
  return '/dashboard';
}

function formatTimestamp(value: string) {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
}

export function TopNav({
  title,
  subtitle,
  onMenuClick,
  onLogout,
  userName,
  userAvatarUrl,
  chatHref,
  userRole,
}: TopNavProps) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const notifRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { unreadCount } = useChatBadge();
  const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const {
    notifications,
    unreadCount: notificationCount,
    markRead,
    markAllRead,
    remove,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const notificationLabel = notificationCount > 99 ? '99+' : String(notificationCount);
  const latestNotifications = useMemo(() => notifications, [notifications]);
  const notificationPageHref = resolveNotificationPage(userRole);
  const roleMeta = useMemo(() => {
    if (userRole === 'student') return { label: 'Student', className: 'border-blue-200 bg-blue-50 text-blue-700' };
    if (userRole === 'adviser') return { label: 'Adviser', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    if (userRole === 'instructor' || userRole === 'teacher') {
      return { label: 'Teacher', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    }
    if (!userRole) return null;
    return { label: userRole.charAt(0).toUpperCase() + userRole.slice(1), className: 'border-neutral-200 bg-neutral-50 text-neutral-600' };
  }, [userRole]);

  const handleNotifScroll = useMemo(
    () => (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remaining < 80 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (event: MouseEvent) => {
      if (!notifRef.current) return;
      if (event.target instanceof Node && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  useEffect(() => {
    if (notifOpen && notificationCount > 0) {
      markAllRead();
    }
  }, [markAllRead, notifOpen, notificationCount]);

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 10px 30px -22px rgba(15,23,42,0.55)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 transition-colors lg:hidden"
            style={{ border: '1px solid var(--border)', color: 'var(--brand-blue-deep)' }}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</div>
              {roleMeta ? (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleMeta.className}`}>
                  {roleMeta.label}
                </span>
              ) : null}
            </div>
            {subtitle ? <div className="text-xs" style={{ color: 'rgba(15,23,42,0.5)' }}>{subtitle}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <form
            className="hidden items-center gap-2 rounded-full px-4 py-2 text-xs md:flex"
            style={{ background: 'rgba(241,244,251,0.9)', border: '1px solid var(--border)', color: 'rgba(15,23,42,0.5)' }}
            onSubmit={(event) => {
              event.preventDefault();
              const query = searchValue.trim();
              if (!query) return;
              if (userRole === 'student') {
                router.push(`/dashboard/student/search?q=${encodeURIComponent(query)}`);
                return;
              }
              if (userRole === 'teacher' || userRole === 'instructor' || userRole === 'adviser') {
                router.push(`/dashboard/teacher/search?q=${encodeURIComponent(query)}`);
              }
            }}
          >
            <Search className="h-3 w-3" />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search courses, students, staff"
              className="w-56 bg-transparent text-xs text-neutral-600 placeholder:text-neutral-400 outline-none"
            />
          </form>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                className="relative rounded-full p-2 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--brand-blue-deep)', background: 'var(--surface-2)' }}
                aria-label="Notifications"
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {notificationLabel}
                  </span>
                ) : null}
              </button>
              {notifOpen ? (
                <div
                  className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl shadow-lg"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    <span>Notifications</span>
                    <Link href={notificationPageHref} className="text-[11px] text-blue-600">
                      View all
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-auto" onScroll={handleNotifScroll}>
                    {latestNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-neutral-500">No notifications yet.</div>
                    ) : (
                      latestNotifications.map((item) => {
                        const href = resolveNotificationHref(item, userRole);
                        return (
                          <Link
                            key={item.id}
                            href={href}
                            className="flex items-start gap-3 px-4 py-3 text-xs transition-colors hover:bg-[var(--surface-2)]"
                            onClick={async () => {
                              setNotifOpen(false);
                              if (!item.is_read) {
                                await markRead(item.id);
                              }
                            }}
                          >
                            <div className="mt-1 h-2 w-2 rounded-full bg-red-500" style={{ opacity: item.is_read ? 0.2 : 1 }} />
                            <div className="flex-1">
                              <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                {item.title}
                              </div>
                              {item.body ? (
                                <div className="text-[11px]" style={{ color: 'rgba(15,23,42,0.6)' }}>
                                  {item.body}
                                </div>
                              ) : null}
                              <div className="text-[10px]" style={{ color: 'rgba(15,23,42,0.4)' }}>
                                {formatTimestamp(item.created_at)}
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label="Delete notification"
                              className="ml-2 rounded-md p-1 text-neutral-400 transition hover:text-red-500"
                              onClick={async (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                await remove(item.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        );
                      })
                    )}
                    {isFetchingNextPage ? (
                      <div className="px-4 py-3 text-center text-[11px] text-neutral-500">Loading more…</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {chatHref ? (
              <Link
                href={chatHref}
                className="relative rounded-full p-2 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--brand-blue-deep)', background: 'var(--surface-2)' }}
                aria-label="Messages"
              >
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadLabel}
                  </span>
                ) : null}
              </Link>
            ) : (
              <button
                className="relative rounded-full p-2 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--brand-blue-deep)', background: 'var(--surface-2)' }}
                aria-label="Messages"
              >
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadLabel}
                  </span>
                ) : null}
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full" style={{ background: 'var(--brand-blue)' }}>
                  {userAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="hidden text-xs font-medium md:block" style={{ color: 'var(--foreground)' }}>
                  {userName && userName.length > 0 ? userName : 'Account'}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-neutral-500 md:block" />
              </button>
              {open ? (
                <div
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl shadow-lg"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  role="menu"
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--foreground)' }}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--foreground)' }}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      onLogout?.();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--foreground)' }}
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
