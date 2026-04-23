'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useSubmitAssignment } from '@/features/assignments/hooks/useSubmitAssignment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  ArrowLeft, Calendar, Star, BookOpen, CheckCircle,
  Clock, MessageSquare, Paperclip, ExternalLink, AlertCircle,
} from 'lucide-react';

function getStatus(dueDate: string, submission?: { submitted_at?: string; graded_at?: string; score?: number }) {
  if (submission) {
    if (submission.graded_at || typeof submission.score === 'number')
      return { label: 'Graded', color: '#059669', light: 'rgba(5,150,105,0.1)' };
    const due = new Date(dueDate);
    const sub = submission.submitted_at ? new Date(submission.submitted_at) : null;
    if (sub && sub > due)
      return { label: 'Late', color: '#dc2626', light: 'rgba(220,38,38,0.1)' };
    return { label: 'Submitted', color: '#d97706', light: 'rgba(217,119,6,0.1)' };
  }
  const due = new Date(dueDate);
  if (!Number.isNaN(due.getTime()) && due < new Date())
    return { label: 'Overdue', color: '#dc2626', light: 'rgba(220,38,38,0.1)' };
  return { label: 'Pending', color: '#0891b2', light: 'rgba(8,145,178,0.1)' };
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

  const assignment = assignments.find((a) => a.id === assignmentId);
  const submission = submissions.find((s) => s.assignment_id === assignmentId);
  const status = assignment ? getStatus(assignment.due_date, submission) : { label: 'Pending', color: '#0891b2', light: 'rgba(8,145,178,0.1)' };

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
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Back ── */}
        <Button as={Link} href="/dashboard/student/assignments" variant="ghost" size="sm"
          className="gap-2 -ml-1 text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Button>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/60">
                {assignment?.subject_name ?? 'Assignment'}
              </p>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">
                {assignment?.title ?? 'Loading…'}
              </h1>
            </div>
            {/* Status pill */}
            {assignment && (
              <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
                <span className="text-sm font-bold text-white">{status.label}</span>
              </div>
            )}
          </div>
        </div>

        {!assignment ? (
          <div className="rounded-2xl border p-16 text-center text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            Assignment not found.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Left: details + submission ── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Details card */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Assignment Details
                  </h2>
                </div>
                <div className="p-6">
                  {assignment.description ? (
                    <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                      {assignment.description}
                    </p>
                  ) : (
                    <p className="mb-6 text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
                      No description provided.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                      { icon: <BookOpen className="h-4 w-4" />, label: 'Subject', value: assignment.subject_name ?? '—' },
                      { icon: <Star className="h-4 w-4" />, label: 'Total Points', value: String(assignment.total_points) },
                      { icon: <Calendar className="h-4 w-4" />, label: 'Due Date', value: new Date(assignment.due_date).toLocaleDateString() },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                        <div className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {item.icon}
                          {item.label}
                        </div>
                        <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submission card */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    {submission ? 'Your Submission' : 'Submit Assignment'}
                  </h2>
                </div>
                <div className="p-6">
                  {submission ? (
                    <div className="space-y-5">
                      {/* Submitted at */}
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock className="h-4 w-4" />
                        Submitted {new Date(submission.submitted_at).toLocaleString()}
                      </div>

                      {/* Answer */}
                      {submission.submission_text && (
                        <div className="rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                          <div className="border-b px-4 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>
                              Your Answer
                            </p>
                          </div>
                          <p className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
                            {submission.submission_text}
                          </p>
                        </div>
                      )}

                      {/* Attachment */}
                      {submission.submission_file && (
                        <a href={submission.submission_file} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-semibold hover:underline"
                          style={{ color: 'var(--brand-blue)' }}>
                          <ExternalLink className="h-4 w-4" />
                          View attachment
                        </a>
                      )}

                      {/* Feedback */}
                      <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            Teacher Feedback
                          </p>
                          <p className="text-sm leading-relaxed text-emerald-900">
                            {submission.feedback || 'No feedback yet.'}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      {typeof submission.score === 'number' && (
                        <div className="flex items-center gap-3 rounded-xl border px-5 py-4"
                          style={{ borderColor: '#6ee7b7', background: 'rgba(5,150,105,0.06)' }}>
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Score</p>
                            <p className="text-lg font-bold text-emerald-800">
                              {submission.score} / {assignment.total_points}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}
                          htmlFor="text_answer">
                          Your Answer <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <textarea
                          id="text_answer"
                          name="text_answer"
                          rows={6}
                          placeholder="Type your response here…"
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none focus:ring-2"
                          style={{
                            borderColor: 'var(--border)',
                            background: 'var(--surface-2)',
                            color: 'var(--foreground)',
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}
                          htmlFor="file_url">
                          Attachment Link <span className="normal-case font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                          <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                          <Input id="file_url" name="file_url"
                            placeholder="Paste a Google Drive or file link…"
                            className="pl-9" />
                        </div>
                      </div>
                      <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                        {submitMutation.isPending ? 'Submitting…' : 'Submit Assignment'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4">
              {/* Status card */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="h-1.5 w-full" style={{ background: status.color }} />
                <div className="p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Status
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: status.light }}>
                      {status.label === 'Graded'
                        ? <CheckCircle className="h-5 w-5" style={{ color: status.color }} />
                        : status.label === 'Overdue' || status.label === 'Late'
                          ? <AlertCircle className="h-5 w-5" style={{ color: status.color }} />
                          : <Clock className="h-5 w-5" style={{ color: status.color }} />}
                    </span>
                    <div>
                      <p className="text-base font-bold" style={{ color: status.color }}>{status.label}</p>
                      {submission?.submitted_at && (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick info */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Quick Info
                  </h2>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {[
                    { label: 'Subject', value: assignment.subject_name ?? '—' },
                    { label: 'Points', value: `${assignment.total_points} pts` },
                    { label: 'Due', value: new Date(assignment.due_date).toLocaleDateString() },
                    { label: 'Late allowed', value: assignment.allow_late_submission ? 'Yes' : 'No' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
