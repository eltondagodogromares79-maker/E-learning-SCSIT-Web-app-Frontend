'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentNav } from '@/components/navigation/nav-config';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import type { AttendanceSession } from '@/types';

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
  if (session.subject_name) return `${session.subject_name} online class`;
  return 'Online class';
}

export default function StudentOnlineClassesPage() {
  const { data: sessions = [], refetch } = useAttendanceSessions();
  const [query, setQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const onlineSessions = useMemo(
    () => sessions.filter((session) => session.is_online_class),
    [sessions]
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return onlineSessions;
    return onlineSessions.filter((session) => {
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
  }, [onlineSessions, query]);

  return (
    <AppShell title="Student Dashboard" subtitle="Online Classes" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Online classes"
          description="Join scheduled online classes and track your attendance."
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white p-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search online classes"
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
                ? `No online classes found for "${query.trim()}".`
                : 'No online classes yet.'}
            </div>
          ) : (
            filtered.map((session) => {
              const status = session.my_status ?? 'absent';
              const statusLabel = session.my_status ? status : 'pending';
              return (
                <Card key={session.id} className="shadow-sm">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`border-0 ${statusStyles[status] ?? 'bg-slate-100 text-slate-700'}`}>
                        {statusLabel}
                      </Badge>
                      {session.created_by_name ? (
                        <span className="text-xs text-neutral-500">By {session.created_by_name}</span>
                      ) : null}
                    </div>
                    <Button
                      disabled={joiningId === session.id || Boolean(session.ended_at) || !session.is_live}
                      onClick={async () => {
                        setJoiningId(session.id);
                        try {
                          const result = await attendanceService.joinSession(session.id);
                          const url = result?.join_url ?? session.join_url;
                          if (url) {
                            window.open(url, '_blank');
                          }
                        } finally {
                          await refetch();
                          setJoiningId(null);
                        }
                      }}
                    >
                      {session.ended_at
                        ? 'Class ended'
                        : !session.is_live
                        ? 'Waiting for teacher'
                        : joiningId === session.id
                        ? 'Joining…'
                        : 'Join class'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
