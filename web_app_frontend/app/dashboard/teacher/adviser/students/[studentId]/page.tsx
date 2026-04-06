'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { teacherNav } from '@/components/navigation/nav-config';
import { useStudentPerformanceDetail } from '@/features/dashboard/hooks/useStudentPerformanceDetail';
import Link from 'next/link';

export default function AdviserStudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const { data, isLoading } = useStudentPerformanceDetail(studentId);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Student record" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={data?.student_name ?? 'Student record'}
          description={data?.section_name ? `${data.section_name}` : 'Student performance overview.'}
          actions={
            <Button variant="secondary" as={Link} href="/dashboard/teacher/adviser">
              Back to My Section
            </Button>
          }
        />

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            Loading student record…
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            Student record not available.
          </div>
        ) : (
          <>
            <Card className="border border-[rgba(30,79,214,0.12)] bg-gradient-to-br from-white via-white to-blue-50/60">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                {data.student_number ? <Badge variant="outline">ID {data.student_number}</Badge> : null}
                <Badge variant="outline">Section {data.section_name ?? '—'}</Badge>
                <Badge variant="outline">
                  Attendance {data.attendance.present} present · {data.attendance.absent} absent
                </Badge>
                <Badge variant="outline">
                  Late {data.attendance.late} · Excused {data.attendance.excused}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border border-[rgba(17,17,17,0.12)] bg-white/90">
              <CardHeader>
                <CardTitle>Subjects & performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.subjects.map((subject, index) => (
                  <div
                    key={subject.section_subject_id}
                    className={`rounded-2xl border border-neutral-200/70 p-4 ${
                      index % 2 === 0 ? 'bg-white/95' : 'bg-blue-50/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{subject.subject_name}</div>
                        <div className="text-xs text-neutral-500">{subject.teacher_name ?? 'Teacher assigned'}</div>
                      </div>
                      <Badge className="border border-rose-200 bg-rose-50 text-rose-700">
                        Violations {subject.violations}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-neutral-600">
                      <div className="rounded-xl border border-neutral-200 bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Assignments</div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900">
                          {subject.assignments_score} / {subject.assignments_total}
                        </div>
                        <div className="mt-1">Missing: {subject.missing_assignments}</div>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Quizzes</div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900">
                          {subject.quizzes_score} / {subject.quizzes_total}
                        </div>
                        <div className="mt-1">Missing: {subject.missing_quizzes}</div>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Progress</div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900">
                          {subject.assignments_total + subject.quizzes_total > 0
                            ? `${Math.round(
                                ((subject.assignments_score + subject.quizzes_score) /
                                  (subject.assignments_total + subject.quizzes_total)) *
                                  100
                              )}%`
                            : '—'}
                        </div>
                        <div className="mt-1">Overall score rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

