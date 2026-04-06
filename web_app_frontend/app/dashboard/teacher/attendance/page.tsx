'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Users, ClipboardCheck } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useAttendanceRecords } from '@/features/attendance/hooks/useAttendanceRecords';
import { useCreateAttendanceSession } from '@/features/attendance/hooks/useCreateAttendanceSession';
import { useMarkAttendance } from '@/features/attendance/hooks/useMarkAttendance';
import { useEndAttendanceSession } from '@/features/attendance/hooks/useEndAttendanceSession';
import { useStartAttendanceSession } from '@/features/attendance/hooks/useStartAttendanceSession';
import { useUpdateAttendanceSession } from '@/features/attendance/hooks/useUpdateAttendanceSession';
import { useDeleteAttendanceSession } from '@/features/attendance/hooks/useDeleteAttendanceSession';
import { useConfirm } from '@/components/ui/confirm';
import { useToast } from '@/components/ui/toast';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const statusOptions: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
const statusStyles: Record<AttendanceStatus, string> = {
  present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  absent: 'border-rose-200 bg-rose-50 text-rose-700',
  late: 'border-amber-200 bg-amber-50 text-amber-700',
  excused: 'border-slate-200 bg-slate-50 text-slate-700',
};

const sessionPillStyles = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  ended: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function TeacherAttendancePage() {
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isOnlineClass, setIsOnlineClass] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sessionQuery, setSessionQuery] = useState('');
  const [recordQuery, setRecordQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const createSession = useCreateAttendanceSession();
  const { data: sessions = [] } = useAttendanceSessions(
    sectionSubjectId ? { section_subject: sectionSubjectId } : undefined
  );
  const { data: records = [] } = useAttendanceRecords(activeSessionId);
  const markAttendance = useMarkAttendance(activeSessionId);
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

  const selectedSection = sectionSubjects.find((item) => item.id === sectionSubjectId);
  const activeSession = sessions.find((session) => session.id === activeSessionId);

  const openEdit = (session: { id: string; title?: string | null; scheduled_at: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title ?? '');
    const local = new Date(session.scheduled_at);
    const pad = (value: number) => value.toString().padStart(2, '0');
    const formatted = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setEditScheduledAt(formatted);
    setEditOpen(true);
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

  const filteredRecords = useMemo(() => {
    const trimmed = recordQuery.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      if (!trimmed) return matchesStatus;
      const haystack = [
        record.student_name,
        record.student_number,
        record.student,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && haystack.includes(trimmed);
    });
  }, [recordQuery, records, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((rec) => {
      map[rec.status] += 1;
    });
    return map;
  }, [records]);

  const updateStatus = (record: AttendanceRecord, status: AttendanceStatus) => {
    markAttendance.mutate([{ id: record.id, status }]);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Attendance" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description="Create sessions and mark attendance per class."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total sessions', value: sessions.length, icon: CalendarClock },
            { label: 'Students in session', value: activeSessionId ? records.length : 0, icon: Users },
            { label: 'Marked present', value: counts.present, icon: ClipboardCheck },
          ].map((stat) => (
            <Card key={stat.label} className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {stat.value}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(37,99,235,0.1)] text-[var(--brand-blue-deep)]">
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Create attendance session</CardTitle>
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
                onChange={(event) => {
                  setSectionSubjectId(event.target.value);
                  setActiveSessionId('');
                }}
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
              <Input
                type="datetime-local"
                min={nowLocal()}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
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
                  const iso = new Date(scheduledAt).toISOString();
                  createSession.mutate({
                    section_subject: sectionSubjectId,
                    title: title.trim() || undefined,
                    scheduled_at: iso,
                    is_online_class: isOnlineClass,
                  });
                  setTitle('');
                  setScheduledAt('');
                  setIsOnlineClass(false);
                }}
              >
                {createSession.isPending ? 'Creating...' : 'Create session'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Sessions {selectedSection ? `for ${selectedSection.subject_name}` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  placeholder="Search sessions"
                  className="md:w-72"
                  value={sessionQuery}
                  onChange={(event) => setSessionQuery(event.target.value)}
                />
                <div className="text-xs text-neutral-500">{filteredSessions.length} sessions</div>
              </div>
              {filteredSessions.length === 0 ? (
                <div className="text-sm text-neutral-500">No attendance sessions yet.</div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left text-sm transition ${
                      activeSessionId === session.id
                        ? 'border-[var(--brand-blue)] bg-[rgba(37,99,235,0.08)] shadow-sm'
                        : 'border-[rgba(15,23,42,0.12)] bg-white hover:-translate-y-0.5 hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Session</span>
                        {activeSessionId === session.id ? (
                          <span className="rounded-full bg-[var(--brand-blue)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            Active
                          </span>
                        ) : null}
                        {session.is_online_class ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              session.ended_at
                                ? sessionPillStyles.ended
                                : session.is_live
                                ? sessionPillStyles.live
                                : sessionPillStyles.pending
                            }`}
                          >
                            {session.ended_at ? 'Ended' : session.is_live ? 'Live' : 'Waiting'}
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate text-base font-semibold text-neutral-900">
                        {session.title || 'Attendance session'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(session.scheduled_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {session.section_name}
                      {session.subject_name ? ` • ${session.subject_name}` : ''}
                      {session.is_online_class ? ' • Online class' : ''}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle>Mark attendance</CardTitle>
              {activeSession ? (
                <div className="text-xs text-neutral-500">
                  {activeSession.title || 'Attendance session'} • {new Date(activeSession.scheduled_at).toLocaleString()}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeSessionId ? (
                <div className="text-sm text-neutral-500">Select a session to mark attendance.</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-neutral-500">
                      Joined: {(activeSession.present_count ?? 0) + (activeSession.late_count ?? 0) + (activeSession.excused_count ?? 0)}
                      {' '} / {activeSession.total_count ?? records.length}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => openEdit(activeSession)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={deleteSession.isPending}
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete session',
                            description: 'Remove this attendance session? This cannot be undone.',
                            danger: true,
                          });
                          if (!ok || !activeSessionId) return;
                          deleteSession.mutate(activeSessionId);
                        }}
                      >
                        Delete
                      </Button>
                      {activeSession.is_online_class ? (
                        <Button
                          disabled={startSession.isPending || Boolean(activeSession.ended_at) || activeSession.is_live}
                          onClick={async () => {
                          if (!activeSessionId) return;
                          try {
                            const result = await startSession.mutateAsync(activeSessionId);
                            const url = result?.join_url ?? activeSession.join_url;
                            if (url) {
                              window.open(url, '_blank');
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-deep)]"
                      >
                          {activeSession.ended_at
                            ? 'Class ended'
                            : activeSession.is_live
                            ? 'Class live'
                            : startSession.isPending
                            ? 'Starting…'
                            : 'Start class'}
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        disabled={endSession.isPending || Boolean(activeSession.ended_at)}
                        onClick={() => {
                          if (!activeSessionId) return;
                          endSession.mutate(activeSessionId);
                        }}
                      >
                        {activeSession.ended_at ? 'Class ended' : endSession.isPending ? 'Ending…' : 'End class'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Input
                      placeholder="Search student"
                      className="md:w-72"
                      value={recordQuery}
                      onChange={(event) => setRecordQuery(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {(['all', ...statusOptions] as Array<'all' | AttendanceStatus>).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusFilter(status)}
                          className={`rounded-full border px-3 py-1 text-[11px] capitalize transition ${
                            statusFilter === status
                              ? 'border-[var(--brand-blue)] bg-[rgba(37,99,235,0.12)] text-[var(--brand-blue-deep)]'
                              : 'border-[rgba(15,23,42,0.12)] text-neutral-500 hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                    <div className={`rounded-xl border p-3 ${statusStyles.present}`}>Present: {counts.present}</div>
                    <div className={`rounded-xl border p-3 ${statusStyles.absent}`}>Absent: {counts.absent}</div>
                    <div className={`rounded-xl border p-3 ${statusStyles.late}`}>Late: {counts.late}</div>
                    <div className={`rounded-xl border p-3 ${statusStyles.excused}`}>Excused: {counts.excused}</div>
                  </div>
                  <div className="max-h-[460px] space-y-3 overflow-auto pr-2">
                    {filteredRecords.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.2)] bg-[var(--surface-2)] p-6 text-center text-sm text-neutral-500">
                        No students match the current filters.
                      </div>
                    ) : (
                      filteredRecords.map((record) => (
                      <div key={record.id} className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900">{record.student_name ?? 'Student'}</div>
                            <div className="text-xs text-neutral-500">{record.student_number ?? record.student}</div>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[11px] capitalize ${statusStyles[record.status]}`}>
                            {record.status}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateStatus(record, status)}
                                className={`rounded-full border px-3 py-1 text-[11px] capitalize transition ${
                                  record.status === status
                                    ? 'border-[var(--brand-blue)] bg-[rgba(37,99,235,0.12)] text-[var(--brand-blue-deep)]'
                                    : 'border-[rgba(15,23,42,0.12)] text-neutral-500 hover:bg-[var(--surface-2)]'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
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
