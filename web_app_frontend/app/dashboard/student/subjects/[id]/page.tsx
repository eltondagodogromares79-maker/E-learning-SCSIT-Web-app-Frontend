'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { studentNav } from '@/components/navigation/nav-config';
import { useSubjectContent } from '@/features/subjects/hooks/useSubjectContent';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';

export default function StudentSubjectDetailPage() {
  const params = useParams();
  const subjectId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data, isLoading } = useSubjectContent(subjectId);
  const { data: submissions = [] } = useAssignmentSubmissions();
  const submissionLookup = Object.fromEntries(
    submissions.map((submission) => [submission.assignment_id, submission])
  );

  return (
    <AppShell title="Student Dashboard" subtitle="Subject" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title={data?.subject.name ?? 'Subject details'}
          description={data?.subject.code ?? 'View lessons, assignments, and quizzes.'}
          actions={<Button variant="outline">View progress</Button>}
        />

        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">Loading subject content…</div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div><span className="text-neutral-500">Instructor:</span> {data?.subject.instructor_name ?? 'TBA'}</div>
                <div><span className="text-neutral-500">Units:</span> {data?.subject.units ?? '—'}</div>
                {data?.subject.description ? (
                  <div><span className="text-neutral-500">Description:</span> {data.subject.description}</div>
                ) : null}
              </CardContent>
            </Card>
            <section className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lessons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.lessons.length ? (
                    data.lessons.map((lesson) => (
                      <div key={lesson.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{lesson.content_type.toUpperCase()}</Badge>
                            <Button
                              as={Link}
                              href={`/dashboard/student/lessons/${lesson.id}`}
                              size="sm"
                              variant="outline"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          Added {new Date(lesson.created_at).toLocaleDateString()}
                        </div>
                        {lesson.file_url ? (
                          lesson.content_type === 'image' ? (
                            <div className="mt-3 overflow-hidden rounded-lg border border-[rgba(17,17,17,0.12)] bg-white">
                              <img
                                src={lesson.file_url}
                                alt={lesson.title}
                                className="h-40 w-full object-cover"
                              />
                            </div>
                          ) : lesson.content_type === 'link' ? (
                            <div className="mt-3 text-xs text-neutral-600">
                              <a
                                href={lesson.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--brand-blue-deep)] hover:underline"
                              >
                                Open lesson link
                              </a>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button
                                as={Link}
                                href={lesson.file_url}
                                target="_blank"
                                rel="noreferrer"
                                size="sm"
                              >
                                Open file
                              </Button>
                            </div>
                          )
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-500">No lessons found.</div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.assignments.length ? (
                    data.assignments.map((assignment) => {
                      const submission = submissionLookup[assignment.id];
                      let statusLabel = 'Pending';
                      let statusDetail = 'Not submitted';
                      let statusVariant: 'outline' | 'muted' | 'destructive' | 'success' = 'outline';
                      if (submission) {
                        if (submission.graded_at || typeof submission.score === 'number') {
                          statusLabel = 'Completed';
                          statusVariant = 'success';
                          statusDetail = 'Graded';
                        } else {
                          const due = new Date(assignment.due_date);
                          const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
                          if (submittedAt && !Number.isNaN(submittedAt.getTime()) && !Number.isNaN(due.getTime())) {
                            if (submittedAt > due) {
                              statusLabel = 'Late';
                              statusVariant = 'destructive';
                              statusDetail = 'Submitted late';
                            } else {
                              statusLabel = 'Submitted';
                              statusVariant = 'muted';
                              statusDetail = 'On time';
                            }
                          } else {
                            statusLabel = 'Submitted';
                            statusVariant = 'muted';
                            statusDetail = 'On time';
                          }
                        }
                      } else {
                        const due = new Date(assignment.due_date);
                        if (!Number.isNaN(due.getTime()) && due < new Date()) {
                          statusLabel = 'Late';
                          statusVariant = 'destructive';
                          statusDetail = 'Overdue';
                        }
                      }
                      return (
                        <div key={assignment.id} className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">{assignment.title}</div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                <Badge variant="outline">Due {new Date(assignment.due_date).toLocaleDateString()}</Badge>
                                <span>Total points: {assignment.total_points}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={statusVariant}>{statusLabel}</Badge>
                              <Button
                                as={Link}
                                href={`/dashboard/student/assignments/${assignment.id}`}
                                size="sm"
                                variant="outline"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-neutral-500">{statusDetail}</div>
                          {submission?.submission_text ? (
                            <div className="mt-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3 text-xs text-neutral-600">
                              <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Answer preview</div>
                              <div className="mt-1">
                                {submission.submission_text.slice(0, 120)}
                                {submission.submission_text.length > 120 ? '…' : ''}
                              </div>
                            </div>
                          ) : null}
                          {submission?.submitted_at ? (
                            <div className="mt-2 text-xs text-neutral-500">
                              Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-neutral-500">No assignments found.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quizzes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data?.quizzes.length ? (
                    data.quizzes.map((quiz) => (
                      <div key={quiz.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-4">
                        <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <Badge variant="outline">{quiz.time_limit_minutes ?? 20} mins</Badge>
                          <Badge variant="muted">Attempts: {quiz.attempt_limit}</Badge>
                          <Badge variant="outline">
                            Due {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : 'TBA'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-500">No quizzes found.</div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
