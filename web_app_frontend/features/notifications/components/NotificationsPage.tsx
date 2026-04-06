'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

export function NotificationsPage() {
  const pathname = usePathname();
  const {
    notifications,
    unreadCount,
    markAllRead,
    remove,
    removeMany,
    removeAll,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (unreadCount > 0) {
      markAllRead();
    }
  }, [markAllRead, unreadCount]);

  const allSelected = useMemo(
    () => notifications.length > 0 && selected.size === notifications.length,
    [notifications.length, selected.size]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(notifications.map((item) => item.id)));
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining < 120 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const buildHref = (kind: string, targetId: string, sectionSubjectId?: string | null) => {
    const isStudent = pathname?.includes('/dashboard/student');
    const base = isStudent ? '/dashboard/student' : '/dashboard/teacher';
    if (kind === 'lesson') return `${base}/lessons/${targetId}`;
    if (kind === 'assignment') return `${base}/assignments/${targetId}`;
    if (kind === 'quiz') return `${base}/quizzes`;
    if (kind === 'assignment_submission') return `/dashboard/teacher/assignments/${targetId}`;
    if (kind === 'quiz_submission')
      return sectionSubjectId ? `/dashboard/teacher/classes/${sectionSubjectId}` : '/dashboard/teacher/quizzes';
    if (kind === 'attendance') {
      if (isStudent) return '/dashboard/student/attendance';
      return '/dashboard/teacher/attendance';
    }
    return base;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Bell className="h-5 w-5 text-[var(--brand-blue-deep)]" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <div className="text-xs text-neutral-500">{notifications.length} total</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={toggleSelectAll}>
              {allSelected ? 'Clear selection' : 'Select all'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => removeMany(Array.from(selected))}
              disabled={selected.size === 0}
            >
              Delete selected
            </Button>
            <Button variant="ghost" size="sm" onClick={removeAll} disabled={notifications.length === 0}>
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-auto" onScroll={handleScroll}>
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-sm text-neutral-500">No notifications yet.</div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={buildHref(item.kind, item.target_id, item.section_subject_id)}
                  className="flex items-start gap-3 border-t border-[rgba(15,23,42,0.06)] px-6 py-4 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 h-4 w-4"
                    onClick={(event) => event.stopPropagation()}
                  />
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500" style={{ opacity: item.is_read ? 0.2 : 1 }} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
                    {item.body ? <div className="text-xs text-neutral-500">{item.body}</div> : null}
                    <div className="text-[11px] text-neutral-400">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-md p-2 text-neutral-400 hover:text-red-500"
                    aria-label="Delete notification"
                    onMouseDown={(event) => event.preventDefault()}
                    onClickCapture={(event) => event.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>
              ))
            )}
            {isFetchingNextPage ? (
              <div className="px-6 py-4 text-center text-xs text-neutral-500">Loading more…</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
