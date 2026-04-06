'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useAiGradeSubmission } from '@/features/assignments/hooks/useAiGradeSubmission';
import { useGradeSubmission } from '@/features/assignments/hooks/useGradeSubmission';

type DraftMap = Record<string, { score: string; feedback: string }>;

export default function TeacherAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data: assignments = [] } = useAssignments();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const aiGrade = useAiGradeSubmission();
  const manualGrade = useGradeSubmission();

  const assignment = assignments.find((item) => item.id === assignmentId);
  const filteredSubmissions = submissions.filter((item) => item.assignment_id === assignmentId);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [timelinessFilter, setTimelinessFilter] = useState<'all' | 'late' | 'on_time'>('all');

  const getDraft = (id: string) => drafts[id] ?? { score: '', feedback: '' };
  const setDraft = (id: string, patch: Partial<DraftMap[string]>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraft(id), ...patch },
    }));
  };

  const getStatus = (submittedAt?: string) => {
    if (!submittedAt || !assignment) return { label: 'Pending', variant: 'outline' as const };
    const due = new Date(assignment.due_date);
    const submitted = new Date(submittedAt);
    if (!Number.isNaN(due.getTime()) && !Number.isNaN(submitted.getTime()) && submitted > due) {
      return { label: 'Late', variant: 'destructive' as const };
    }
    return { label: 'On time', variant: 'muted' as const };
  };

  const loweredSearch = submissionSearch.trim().toLowerCase();
  const gradedSubmissions = filteredSubmissions.filter(
    (submission) => submission.score !== undefined && submission.score !== null
  );
  const filteredByScore =
    submissionFilter === 'graded'
      ? gradedSubmissions
      : submissionFilter === 'ungraded'
      ? filteredSubmissions.filter((submission) => submission.score === undefined || submission.score === null)
      : filteredSubmissions;
  const filteredByTime =
    timelinessFilter === 'late'
      ? filteredByScore.filter((submission) => {
          if (!assignment?.due_date) return false;
          const submitted = new Date(submission.submitted_at);
          const due = new Date(assignment.due_date);
          return !Number.isNaN(submitted.getTime()) && !Number.isNaN(due.getTime()) && submitted > due;
        })
      : timelinessFilter === 'on_time'
      ? filteredByScore.filter((submission) => {
          if (!assignment?.due_date) return false;
          const submitted = new Date(submission.submitted_at);
          const due = new Date(assignment.due_date);
          return !Number.isNaN(submitted.getTime()) && !Number.isNaN(due.getTime()) && submitted <= due;
        })
      : filteredByScore;
  const searchedSubmissions = loweredSearch
    ? filteredByTime.filter((submission) => {
        const haystack = `${submission.student_name ?? ''} ${submission.student_id ?? ''}`.toLowerCase();
        return haystack.includes(loweredSearch);
      })
    : filteredByTime;

  return (
    <AppShell title="Teacher Dashboard" subtitle="Assignment" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={assignment?.title ?? 'Assignment'}
          description={assignment?.subject_name ?? 'Review and grade submissions.'}
        />

        {!assignment ? (
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-500 shadow-sm">
            Assignment not found.
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Assignment overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div><span className="text-neutral-500">Subject:</span> {assignment.subject_name}</div>
                <div><span className="text-neutral-500">Due date:</span> {new Date(assignment.due_date).toLocaleString()}</div>
                <div><span className="text-neutral-500">Total points:</span> {assignment.total_points}</div>
                {assignment.description ? (
                  <div><span className="text-neutral-500">Description:</span> {assignment.description}</div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Submissions</CardTitle>
                  <Input
                    placeholder="Search student"
                    value={submissionSearch}
                    onChange={(event) => setSubmissionSearch(event.target.value)}
                    className="h-9 w-48"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={submissionFilter === 'all' ? 'default' : 'secondary'}
                    onClick={() => setSubmissionFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={submissionFilter === 'graded' ? 'default' : 'secondary'}
                    onClick={() => setSubmissionFilter('graded')}
                  >
                    Graded
                  </Button>
                  <Button
                    size="sm"
                    variant={submissionFilter === 'ungraded' ? 'default' : 'secondary'}
                    onClick={() => setSubmissionFilter('ungraded')}
                  >
                    Ungraded
                  </Button>
                  <Button
                    size="sm"
                    variant={timelinessFilter === 'late' ? 'default' : 'secondary'}
                    onClick={() => setTimelinessFilter('late')}
                  >
                    Late
                  </Button>
                  <Button
                    size="sm"
                    variant={timelinessFilter === 'on_time' ? 'default' : 'secondary'}
                    onClick={() => setTimelinessFilter('on_time')}
                  >
                    On time
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchedSubmissions.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    {loweredSearch ? 'No matches for this search.' : 'No submissions yet.'}
                  </div>
                ) : (
                  searchedSubmissions.map((submission) => {
                    const status = getStatus(submission.submitted_at);
                    const draft = drafts[submission.id];
                    const currentScore =
                      draft?.score ?? (submission.score !== undefined && submission.score !== null ? String(submission.score) : '');
                    const currentFeedback = draft?.feedback ?? (submission.feedback ?? '');
                    const initials = (submission.student_name ?? 'Student')
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div
                        key={submission.id}
                        className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white/95 p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(15,23,42,0.08)] text-xs font-semibold text-neutral-700">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">
                                {submission.student_name ?? 'Student'}
                              </div>
                              <div className="text-xs text-neutral-500">
                                Submitted {new Date(submission.submitted_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <div className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] px-3 py-2 text-center">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Score</div>
                              <div className="text-lg font-semibold text-neutral-900">{submission.score ?? '—'}</div>
                            </div>
                          </div>
                        </div>

                        {submission.submission_text ? (
                          <div className="mt-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3 text-xs text-neutral-600">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Response</div>
                            <div className="mt-1">{submission.submission_text}</div>
                          </div>
                        ) : null}

                        {submission.submission_file ? (
                          <div className="mt-3 text-xs text-neutral-600">
                            <a
                              href={submission.submission_file}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-[var(--brand-blue-deep)] hover:underline"
                            >
                              View attachment
                            </a>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 md:grid-cols-[140px,1fr,auto]">
                          <Input
                            placeholder="Score"
                            value={currentScore}
                            onChange={(event) => setDraft(submission.id, { score: event.target.value })}
                          />
                          <Input
                            placeholder="Feedback"
                            value={currentFeedback}
                            onChange={(event) => setDraft(submission.id, { feedback: event.target.value })}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={aiGrade.isPending}
                              onClick={() => aiGrade.mutate(submission.id)}
                            >
                              {aiGrade.isPending ? 'AI grading…' : 'AI grade'}
                            </Button>
                            <Button
                              type="button"
                              disabled={manualGrade.isPending}
                              onClick={() => {
                                const parsedScore = currentScore.trim() === '' ? undefined : Number(currentScore);
                                if (parsedScore !== undefined && Number.isNaN(parsedScore)) return;
                                manualGrade.mutate({
                                  submissionId: submission.id,
                                  score: parsedScore,
                                  feedback: currentFeedback || undefined,
                                });
                              }}
                            >
                              Save grade
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                manualGrade.mutate({
                                  submissionId: submission.id,
                                  score: null,
                                  feedback: '',
                                });
                                setDraft(submission.id, { score: '', feedback: '' });
                              }}
                            >
                              Clear grade
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
