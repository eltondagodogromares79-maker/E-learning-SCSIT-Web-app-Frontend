'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, ClipboardCheck, MonitorPlay, Save, Users } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { teacherNav } from '@/components/navigation/nav-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAttendanceSession } from '@/features/attendance/hooks/useAttendanceSession';
import { useAttendanceRecords } from '@/features/attendance/hooks/useAttendanceRecords';
import { useMarkAttendance } from '@/features/attendance/hooks/useMarkAttendance';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const statusOptions: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];

const statusStyles: Record<AttendanceStatus, string> = {
  present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  absent: 'border-rose-200 bg-rose-50 text-rose-700',
  late: 'border-amber-200 bg-amber-50 text-amber-700',
  excused: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default function TeacherAttendanceSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = String(params?.sessionId ?? '');
  const { data: session } = useAttendanceSession(sessionId);
  const { data: records = [] } = useAttendanceRecords(sessionId);
  const markAttendance = useMarkAttendance(sessionId);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const map: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((record) => {
      map[record.status] += 1;
    });
    return map;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
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
  }, [query, records, statusFilter]);

  const updateStatus = (record: AttendanceRecord, status: AttendanceStatus) => {
    markAttendance.mutate([
      {
        id: record.id,
        status,
        note: notes[record.id] ?? record.note ?? '',
      },
    ]);
  };

  const saveReason = (record: AttendanceRecord) => {
    markAttendance.mutate([
      {
        id: record.id,
        status: record.status,
        note: notes[record.id] ?? record.note ?? '',
      },
    ]);
  };

  const attended = (session?.present_count ?? 0) + (session?.late_count ?? 0) + (session?.excused_count ?? 0);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Session Details" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Button variant="secondary" className="w-fit gap-2" onClick={() => router.push('/dashboard/teacher/attendance')}>
                <ArrowLeft className="h-4 w-4" />
                Back to sessions
              </Button>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-white/70" />
                  <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Session Details</span>
                </div>
                <h1 className="text-3xl font-bold text-white lg:text-4xl">
                  {session?.title || 'Attendance session'}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  {session?.subject_name ?? 'Class'}{session?.section_name ? ` • ${session.section_name}` : ''} • {session?.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Schedule pending'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Total', value: session?.total_count ?? records.length, icon: <Users className="h-4 w-4" /> },
                { label: 'Attended', value: attended, icon: <ClipboardCheck className="h-4 w-4" /> },
                { label: 'Present', value: counts.present, icon: <ClipboardCheck className="h-4 w-4" /> },
                { label: session?.is_online_class ? 'Online' : 'In Person', value: session?.is_live ? 'Live' : session?.ended_at ? 'Ended' : 'Ready', icon: <MonitorPlay className="h-4 w-4" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-white/60">{item.icon}</div>
                  <div className="mt-3 text-lg font-bold text-white">{item.value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Input
                placeholder="Search student"
                className="lg:w-80"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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

            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 lg:grid-cols-4">
              <div className={`rounded-xl border p-3 ${statusStyles.present}`}>Present: {counts.present}</div>
              <div className={`rounded-xl border p-3 ${statusStyles.late}`}>Late: {counts.late}</div>
              <div className={`rounded-xl border p-3 ${statusStyles.excused}`}>Excused: {counts.excused}</div>
              <div className={`rounded-xl border p-3 ${statusStyles.absent}`}>Absent: {counts.absent}</div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.18)] bg-[var(--surface-2)] p-8 text-center text-sm text-neutral-500">
                No students match the current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 lg:w-64">
                        <div className="text-sm font-semibold text-neutral-900">
                          {record.student_name ?? 'Student'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {record.student_number ?? record.student}
                        </div>
                        <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] capitalize ${statusStyles[record.status]}`}>
                          {record.status}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
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

                        <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
                          <Input
                            value={notes[record.id] ?? record.note ?? ''}
                            onChange={(event) =>
                              setNotes((prev) => ({
                                ...prev,
                                [record.id]: event.target.value,
                              }))
                            }
                            placeholder="Add reason or note for this student"
                          />
                          <Button
                            variant="outline"
                            className="gap-2"
                            disabled={markAttendance.isPending}
                            onClick={() => saveReason(record)}
                          >
                            <Save className="h-4 w-4" />
                            Save reason
                          </Button>
                        </div>

                        {record.marked_at ? (
                          <div className="text-xs text-neutral-400">
                            Updated {new Date(record.marked_at).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
