'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ClipboardCheck, ExternalLink, MonitorPlay } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { TeacherRowsSkeleton } from '@/components/layout/TeacherListSkeletons';
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
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';
import { useConfirm } from '@/components/ui/confirm';
import { useToast } from '@/components/ui/toast';

const sessionPillStyles = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  ended: 'border-rose-200 bg-rose-50 text-rose-700',
};

function getSessionState(session: { ended_at?: string | null; is_live?: boolean | null }) {
  if (session.ended_at) return 'ended';
  if (session.is_live) return 'live';
  return 'pending';
}

export default function TeacherAttendancePage() {
  const router = useRouter();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isOnlineClass, setIsOnlineClass] = useState(false);
  const [sessionQuery, setSessionQuery] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const createSession = useCreateAttendanceSession();
  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions(
    sectionSubjectId ? { section_subject: sectionSubjectId } : undefined
  );
  const endSession = useEndAttendanceSession();
  const startSession = useStartAttendanceSession();
  const updateSession = useUpdateAttendanceSession();
  const deleteSession = useDeleteAttendanceSession();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const showSessionSkeleton = useReliableSkeleton(sessionsLoading);

  const selectedSection = sectionSubjects.find((item) => item.id === sectionSubjectId);
  const nowLocal = () => new Date().toISOString().slice(0, 16);

  const isPastDate = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    return date.getTime() < Date.now();
  };

  const filteredSessions = useMemo(() => {
    const trimmed = sessionQuery.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((session) => {
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
  }, [sessionQuery, sessions]);

  const stats = useMemo(() => {
    return sessions.reduce(
      (acc, session) => {
        acc.online += session.is_online_class ? 1 : 0;
        acc.live += session.is_live && !session.ended_at ? 1 : 0;
        acc.present += session.present_count ?? 0;
        return acc;
      },
      { online: 0, live: 0, present: 0 }
    );
  }, [sessions]);

  const openEdit = (session: { id: string; title?: string | null; scheduled_at: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title ?? '');
    const local = new Date(session.scheduled_at);
    const pad = (value: number) => value.toString().padStart(2, '0');
    setEditScheduledAt(`${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`);
    setEditOpen(true);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Attendance" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Attendance</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Class Sessions</h1>
              <p className="mt-2 text-sm text-white/70">
                Open any session to view the student list, mark present, late, absent, or excused, and add reasons.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Total Sessions', value: sessions.length, icon: <CalendarClock className="h-4 w-4" /> },
                { label: 'Live Now', value: stats.live, icon: <MonitorPlay className="h-4 w-4" /> },
                { label: 'Present Marks', value: stats.present, icon: <ClipboardCheck className="h-4 w-4" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-white/60">{item.icon}</span>
                  <div>
                    <div className="text-lg font-bold leading-none text-white">{item.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <CardHeader className="space-y-1">
            <CardTitle>Create Attendance Session</CardTitle>
            <div className="text-xs text-neutral-500">
              {selectedSection
                ? `${selectedSection.subject_name} • ${selectedSection.section_name}`
                : 'Select a class before scheduling.'}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Class</label>
              <select
                className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm"
                value={sectionSubjectId}
                onChange={(event) => setSectionSubjectId(event.target.value)}
              >
                <option value="">Select section subject</option>
                {sectionSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.subject_name} — {item.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Class meeting" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Date & time</label>
              <Input type="datetime-local" min={nowLocal()} value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] px-4 py-3">
              <input
                id="online-class-toggle"
                type="checkbox"
                checked={isOnlineClass}
                onChange={(event) => setIsOnlineClass(event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="online-class-toggle" className="text-sm text-neutral-600">
                Online class (Jitsi)
              </label>
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
                  createSession.mutate({
                    section_subject: sectionSubjectId,
                    title: title.trim() || undefined,
                    scheduled_at: new Date(scheduledAt).toISOString(),
                    is_online_class: isOnlineClass,
                  });
                  setTitle('');
                  setScheduledAt('');
                  setIsOnlineClass(false);
                }}
              >
                {createSession.isPending ? 'Creating…' : 'Create session'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <CardHeader>
            <CardTitle>Session List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Search sessions"
                className="md:w-80"
                value={sessionQuery}
                onChange={(event) => setSessionQuery(event.target.value)}
              />
              <div className="text-xs text-neutral-500">
                {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'} · {stats.online} online
              </div>
            </div>

            {showSessionSkeleton ? (
              <TeacherRowsSkeleton count={5} />
            ) : filteredSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.18)] bg-[var(--surface-2)] p-8 text-center text-sm text-neutral-500">
                No attendance sessions found for the current filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const state = getSessionState(session);
                  const attended = (session.present_count ?? 0) + (session.late_count ?? 0) + (session.excused_count ?? 0);

                  return (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/teacher/attendance/${session.id}`)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Session</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${sessionPillStyles[state]}`}>
                              {state === 'live' ? 'Live' : state === 'ended' ? 'Ended' : 'Waiting'}
                            </span>
                            {session.is_online_class ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                                Online
                              </span>
                            ) : null}
                          </div>
                          <div className="text-lg font-semibold text-neutral-900">
                            {session.title || 'Attendance session'}
                          </div>
                          <div className="mt-1 text-sm text-neutral-500">
                            {session.subject_name ?? 'Class'}{session.section_name ? ` • ${session.section_name}` : ''}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                            <span>{new Date(session.scheduled_at).toLocaleString()}</span>
                            <span>{attended} attended / {session.total_count ?? 0} total</span>
                            <span>Present {session.present_count ?? 0}</span>
                            <span>Late {session.late_count ?? 0}</span>
                            <span>Excused {session.excused_count ?? 0}</span>
                            <span>Absent {session.absent_count ?? 0}</span>
                          </div>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/teacher/attendance/${session.id}`)}
                          >
                            Open session
                            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => openEdit(session)}
                          >
                            Edit
                          </Button>
                          {session.is_online_class ? (
                            <Button
                              size="sm"
                              disabled={startSession.isPending || Boolean(session.ended_at) || session.is_live}
                              onClick={async () => {
                                try {
                                  const result = await startSession.mutateAsync(session.id);
                                  const url = result?.join_url ?? session.join_url;
                                  if (url) window.open(url, '_blank');
                                } catch {
                                  // ignore
                                }
                              }}
                            >
                              {session.ended_at ? 'Class ended' : session.is_live ? 'Class live' : startSession.isPending ? 'Starting…' : 'Start class'}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            disabled={endSession.isPending || Boolean(session.ended_at)}
                            onClick={() => endSession.mutate(session.id)}
                          >
                            {session.ended_at ? 'Ended' : endSession.isPending ? 'Ending…' : 'End'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleteSession.isPending}
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Delete session',
                                description: 'Remove this attendance session? This cannot be undone.',
                                danger: true,
                              });
                              if (ok) deleteSession.mutate(session.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit attendance session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
              <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Date & time</label>
              <Input type="datetime-local" min={nowLocal()} value={editScheduledAt} onChange={(event) => setEditScheduledAt(event.target.value)} />
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
                await updateSession.mutateAsync({
                  sessionId: editingId,
                  payload: {
                    title: editTitle.trim() || undefined,
                    scheduled_at: new Date(editScheduledAt).toISOString(),
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
