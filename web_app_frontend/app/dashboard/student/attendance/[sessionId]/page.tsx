'use client';

import { use } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import { useAttendanceSession } from '@/features/attendance/hooks/useAttendanceSession';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import { useState } from 'react';

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

function buildTitle(title?: string | null, subjectName?: string | null) {
  if (title) return title;
  if (subjectName) return `${subjectName} attendance`;
  return 'Attendance session';
}

export default function StudentAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const { data: session, refetch } = useAttendanceSession(sessionId);
  const [joining, setJoining] = useState(false);

  return (
    <AppShell title="Student Dashboard" subtitle="Attendance" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title={buildTitle(session?.title, session?.subject_name)}
          description="Review the details of this attendance session."
        />
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Link href="/dashboard/student/attendance" className="text-blue-600 hover:underline">
            Back to attendance
          </Link>
          {session?.section_name ? <span>Section: {session.section_name}</span> : null}
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral-600">
            {session?.is_online_class ? (
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Online class</div>
                  <div className="mt-1 text-sm text-neutral-700">
                    Join the live class to mark your attendance.
                  </div>
                </div>
                <Button
                  disabled={joining || Boolean(session.ended_at) || !session?.is_live}
                  onClick={async () => {
                    if (!session?.id) return;
                    setJoining(true);
                    try {
                      const result = await attendanceService.joinSession(session.id);
                      const url = result?.join_url ?? session.join_url;
                      if (url) {
                        window.open(url, '_blank');
                      }
                      await refetch();
                    } finally {
                      setJoining(false);
                    }
                  }}
                >
                  {session.ended_at
                    ? 'Class ended'
                    : !session?.is_live
                    ? 'Waiting for teacher'
                    : joining
                    ? 'Joining…'
                    : 'Join class'}
                </Button>
              </div>
            ) : null}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Scheduled</div>
                <div className="mt-1">{session ? formatWhen(session.scheduled_at) : '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Subject</div>
                <div className="mt-1">
                  {session?.subject_name ? session.subject_name : 'General attendance'}
                  {session?.subject_code ? ` (${session.subject_code})` : ''}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Recorded by</div>
                <div className="mt-1">{session?.created_by_name ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Status</div>
                <div className="mt-2">
                  <Badge
                    className={`border-0 ${statusStyles[session?.my_status ?? 'absent'] ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {session?.my_status ?? 'pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
