'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useStudentTranscript } from '@/features/students/hooks/useStudentTranscript';

export default function StudentTranscriptPage() {
  const { data: enrollments = [], isLoading } = useStudentTranscript();
  const current = enrollments.find((item) => item.is_current);

  return (
    <AppShell title="Student Dashboard" subtitle="Transcript" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Student transcript"
          description="Your enrollment history and subject records."
        />

        <Card>
          <CardHeader>
            <CardTitle>Current enrollment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            {current ? (
              <div className="space-y-2">
                <div>
                  <span className="text-neutral-500">Program:</span> {current.program_name ?? '—'}
                </div>
                <div>
                  <span className="text-neutral-500">Year level:</span> {current.year_level_name ?? '—'}
                </div>
                <div>
                  <span className="text-neutral-500">Term:</span> {current.term_label ?? '—'}
                </div>
                <div>
                  <span className="text-neutral-500">School year:</span> {current.school_year_name ?? '—'}
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">No current enrollment found.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-sm text-neutral-500">Loading transcript…</div>
            ) : enrollments.length === 0 ? (
              <div className="text-sm text-neutral-500">No enrollment history yet.</div>
            ) : (
              enrollments.map((enrollment) => (
                <div key={enrollment.id} className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-neutral-900">
                      {enrollment.program_name ?? 'Program'} • {enrollment.year_level_name ?? 'Year level'}
                    </div>
                    <Badge variant={enrollment.is_current ? 'success' : 'outline'}>
                      {enrollment.is_current ? 'Current' : enrollment.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    {enrollment.term_label ?? '—'} • {enrollment.school_year_name ?? '—'}
                  </div>
                  {enrollment.student_subjects?.length ? (
                    <div className="mt-3 grid gap-2 text-xs text-neutral-600">
                      {enrollment.student_subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between">
                          <div>
                            {subject.subject_code} — {subject.subject_name}
                          </div>
                          <div className="text-neutral-500">{subject.teacher_name ?? 'TBA'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-neutral-500">No subjects recorded.</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
