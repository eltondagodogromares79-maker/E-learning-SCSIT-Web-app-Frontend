'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useSubmitAssignment } from '@/features/assignments/hooks/useSubmitAssignment';
import { useAuth } from '@/features/auth/hooks/useAuth';

function getStatusLabel(dueDate: string, submission?: { submitted_at?: string; graded_at?: string; score?: number }) {
  if (submission) {
    if (submission.graded_at || typeof submission.score === 'number') {
      return 'Completed';
    }
    const due = new Date(dueDate);
    const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
    if (submittedAt && !Number.isNaN(submittedAt.getTime()) && !Number.isNaN(due.getTime())) {
      if (submittedAt > due) {
        return 'Late';
      }
    }
    return 'On time';
  }
  const due = new Date(dueDate);
  if (!Number.isNaN(due.getTime()) && due < new Date()) {
    return 'Late';
  }
  return 'Pending';
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data: assignments = [] } = useAssignments();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const { user } = useAuth();
  const submitMutation = useSubmitAssignment();

  const assignment = assignments.find((item) => item.id === assignmentId);
  const submission = submissions.find((item) => item.assignment_id === assignmentId);

  const status = assignment ? getStatusLabel(assignment.due_date, submission) : 'Pending';

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment || !user?.student?.id) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = (formData.get('text_answer') as string | null) ?? '';
    const link = (formData.get('file_url') as string | null) ?? '';
    await submitMutation.mutateAsync({
      assignment: assignment.id,
      student: user.student.id,
      text_answer: text.trim() || undefined,
      file_url: link.trim() || undefined,
    });
    form.reset();
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Assignment" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title={assignment?.title ?? 'Assignment details'}
          description={assignment?.subject_name ?? 'Review requirements and submit your answer.'}
          actions={assignment ? (
            <Badge
              variant={
                status === 'Late'
                  ? 'destructive'
                  : status === 'Completed'
                    ? 'success'
                    : 'muted'
              }
            >
              {status}
            </Badge>
          ) : undefined}
        />

        {!assignment ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            Assignment not found.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>Assignment details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div><span className="text-neutral-500">Subject:</span> {assignment.subject_name}</div>
                <div><span className="text-neutral-500">Total points:</span> {assignment.total_points}</div>
                <div><span className="text-neutral-500">Due date:</span> {new Date(assignment.due_date).toLocaleString()}</div>
                {assignment.description ? (
                  <div><span className="text-neutral-500">Description:</span> {assignment.description}</div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle>Your submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-neutral-600">
                {submission ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={status === 'Late' ? 'destructive' : status === 'Completed' ? 'success' : 'muted'}>
                        {status}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        Submitted {new Date(submission.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Score</div>
                        <div className="mt-1 text-lg font-semibold text-neutral-900">
                          {typeof submission.score === 'number' ? submission.score : '—'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Feedback</div>
                        <div className="mt-1 text-sm text-neutral-700">
                          {submission.feedback || 'No feedback yet.'}
                        </div>
                      </div>
                    </div>
                    {submission.submission_text ? (
                      <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-3 text-xs text-neutral-600">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Your answer</div>
                        <div className="mt-1">{submission.submission_text}</div>
                      </div>
                    ) : null}
                    {submission.submission_file ? (
                      <div className="text-xs text-neutral-600">
                        <a href={submission.submission_file} target="_blank" rel="noreferrer" className="font-medium text-[var(--brand-blue-deep)] hover:underline">
                          View attachment
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-neutral-400" htmlFor="text_answer">
                        Answer (optional)
                      </label>
                      <textarea
                        id="text_answer"
                        name="text_answer"
                        rows={4}
                        className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                        placeholder="Type your response here..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-neutral-400" htmlFor="file_url">
                        Attachment link (optional)
                      </label>
                      <Input
                        id="file_url"
                        name="file_url"
                        placeholder="Paste a file link or shared drive URL"
                      />
                    </div>
                    <Button type="submit" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? 'Submitting…' : 'Submit assignment'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
