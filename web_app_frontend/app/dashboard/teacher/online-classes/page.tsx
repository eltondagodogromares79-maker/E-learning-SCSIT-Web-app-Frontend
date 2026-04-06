'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useCreateAttendanceSession } from '@/features/attendance/hooks/useCreateAttendanceSession';
import { useEndAttendanceSession } from '@/features/attendance/hooks/useEndAttendanceSession';
import { useStartAttendanceSession } from '@/features/attendance/hooks/useStartAttendanceSession';
import { useUpdateAttendanceSession } from '@/features/attendance/hooks/useUpdateAttendanceSession';
import { useDeleteAttendanceSession } from '@/features/attendance/hooks/useDeleteAttendanceSession';
import { useConfirm } from '@/components/ui/confirm';
import { useToast } from '@/components/ui/toast';

export default function TeacherOnlineClassesPage() {
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const createSession = useCreateAttendanceSession();
  const endSession = useEndAttendanceSession();
  const startSession = useStartAttendanceSession();
  const updateSession = useUpdateAttendanceSession();
  const deleteSession = useDeleteAttendanceSession();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const nowLocal = () => new Date().toISOString().slice(0, 16);
  const isPastDate = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    return date.getTime() < Date.now();
  };
  const { data: sessions = [] } = useAttendanceSessions(
    sectionSubjectId ? { section_subject: sectionSubjectId } : undefined
  );

  const onlineSessions = useMemo(
    () => sessions.filter((session) => session.is_online_class),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return onlineSessions;
    return onlineSessions.filter((session) => {
      const haystack = [
        session.title,
        session.section_name,
        session.subject_name,
        session.subject_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [onlineSessions, query]);

  const openEdit = (session: { id: string; title?: string | null; scheduled_at: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title ?? '');
    const local = new Date(session.scheduled_at);
    const pad = (value: number) => value.toString().padStart(2, '0');
    const formatted = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setEditScheduledAt(formatted);
    setEditOpen(true);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Online Classes" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Online classes"
          description="Create and manage live classes for your sections."
        />

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Create online class</CardTitle>
            <div className="text-xs text-neutral-500">Students will be notified automatically.</div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Class</label>
              <select
                className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm"
                value={sectionSubjectId}
                onChange={(event) => setSectionSubjectId(event.target.value)}
              >
                <option value="">Select a class</option>
                {sectionSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name} — {subject.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Online class" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Date & time</label>
              <Input
                type="datetime-local"
                min={nowLocal()}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <div className="md:col-span-4">
              <Button
                disabled={!sectionSubjectId || !scheduledAt || createSession.isPending}
                onClick={() => {
                  if (!sectionSubjectId || !scheduledAt) return;
                  if (isPastDate(scheduledAt)) {
                    showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' });
                    return;
                  }
                  const iso = new Date(scheduledAt).toISOString();
                  createSession.mutate({
                    section_subject: sectionSubjectId,
                    title: title.trim() || undefined,
                    scheduled_at: iso,
                    is_online_class: true,
                  });
                  setTitle('');
                  setScheduledAt('');
                }}
              >
                {createSession.isPending ? 'Creating…' : 'Create online class'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle>Online class sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Search online classes"
                className="md:w-72"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="text-xs text-neutral-500">{filteredSessions.length} sessions</div>
            </div>
            {filteredSessions.length === 0 ? (
              <div className="text-sm text-neutral-500">No online classes yet.</div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white p-4 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-neutral-900">
                      {session.title || 'Online class'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {session.section_name}
                      {session.subject_name ? ` • ${session.subject_name}` : ''}
                      {session.subject_code ? ` • ${session.subject_code}` : ''}
                    </div>
                    <div className="text-xs text-neutral-500">{new Date(session.scheduled_at).toLocaleString()}</div>
                    <div className="mt-2 text-xs text-neutral-500">
                      Joined: {(session.present_count ?? 0) + (session.late_count ?? 0) + (session.excused_count ?? 0)} / {session.total_count ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {session.join_url ? (
                      <Button
                        variant="outline"
                        disabled={!session.is_live}
                        onClick={() => window.open(session.join_url ?? '', '_blank')}
                      >
                        {session.is_live ? 'Open link' : 'Waiting for start'}
                      </Button>
                    ) : null}
                    <Button
                      disabled={startSession.isPending || Boolean(session.ended_at) || session.is_live}
                      onClick={async () => {
                        try {
                          const result = await startSession.mutateAsync(session.id);
                          const url = result?.join_url ?? session.join_url;
                          if (url) {
                            window.open(url, '_blank');
                          }
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      {session.ended_at
                        ? 'Class ended'
                        : session.is_live
                        ? 'Class live'
                        : startSession.isPending
                        ? 'Starting…'
                        : 'Start class'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => openEdit(session)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={deleteSession.isPending}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete class',
                          description: 'Remove this online class session? This cannot be undone.',
                          danger: true,
                        });
                        if (!ok) return;
                        deleteSession.mutate(session.id);
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      disabled={endSession.isPending || Boolean(session.ended_at)}
                      onClick={() => endSession.mutate(session.id)}
                    >
                      {session.ended_at ? 'Class ended' : endSession.isPending ? 'Ending…' : 'End class'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit online class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
              <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Date & time</label>
              <Input
                type="datetime-local"
                min={nowLocal()}
                value={editScheduledAt}
                onChange={(event) => setEditScheduledAt(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!editingId || updateSession.isPending}
              onClick={async () => {
                if (!editingId || !editScheduledAt) return;
                if (isPastDate(editScheduledAt)) {
                  showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' });
                  return;
                }
                const iso = new Date(editScheduledAt).toISOString();
                await updateSession.mutateAsync({
                  sessionId: editingId,
                  payload: {
                    title: editTitle.trim() || undefined,
                    scheduled_at: iso,
                  },
                });
                setEditOpen(false);
              }}
            >
              {updateSession.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
