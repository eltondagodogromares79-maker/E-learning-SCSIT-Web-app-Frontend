'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { studentNav } from '@/components/navigation/nav-config';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import type { AttendanceSession } from '@/types';
import Link from 'next/link';

const statusStyles: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-slate-100 text-slate-700',
};

function formatWhen(value: string) {
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function buildTitle(session: AttendanceSession) {
  if (session.title) return session.title;
  if (session.subject_name) return `${session.subject_name} attendance`;
  return 'Attendance session';
}

export default function StudentAttendancePage() {
  const { data: sessions = [] } = useAttendanceSessions();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((session) => {
      const haystack = [
        session.title,
        session.subject_name,
        session.subject_code,
        session.section_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [query, sessions]);

  const stats = useMemo(() => {
    return filtered.reduce(
      (acc, session) => {
        if (session.my_status) {
          acc[session.my_status] += 1;
        }
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [filtered]);

  return (
    <AppShell title="Student Dashboard" subtitle="Attendance" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Attendance sessions"
          description="Review every attendance session scheduled for your section or subject."
        />
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Present', value: stats.present, style: statusStyles.present },
            { label: 'Absent', value: stats.absent, style: statusStyles.absent },
            { label: 'Late', value: stats.late, style: statusStyles.late },
            { label: 'Excused', value: stats.excused, style: statusStyles.excused },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  {item.value}
                </div>
                <div className="mt-2">
                  <Badge className={`border-0 ${item.style}`}>{item.label}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white p-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search attendance sessions"
            className="md:w-72"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="text-xs text-neutral-500">{filtered.length} sessions</div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
              {query.trim()
                ? `No sessions found for "${query.trim()}".`
                : 'No attendance sessions yet.'}
            </div>
          ) : (
            filtered.map((session) => {
              const status = session.my_status ?? 'absent';
              const statusLabel = session.my_status ? status : 'pending';
              return (
                <Link key={session.id} href={`/dashboard/student/attendance/${session.id}`} className="group">
                  <Card className="shadow-sm transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <CardHeader className="space-y-2">
                      <CardTitle>{buildTitle(session)}</CardTitle>
                      <div className="text-xs text-neutral-500">
                        {session.subject_name ? `${session.subject_name}` : session.section_name}
                        {session.subject_code ? ` • ${session.subject_code}` : ''}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-neutral-600">
                      <div>
                        <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Scheduled</span>
                        <div className="mt-1">{formatWhen(session.scheduled_at)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`border-0 ${statusStyles[status] ?? 'bg-slate-100 text-slate-700'}`}>
                          {statusLabel}
                        </Badge>
                        {session.created_by_name ? (
                          <span className="text-xs text-neutral-500">By {session.created_by_name}</span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
