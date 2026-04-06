'use client';

import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import Link from 'next/link';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';

export default function StudentAssignmentsPage() {
  const { data: assignments = [] } = useAssignments();
  const { data: subjects = [] } = useSubjects();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.id, subject.name]));
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dueThisWeek = assignments.filter((assignment) => {
    const due = new Date(assignment.due_date);
    return !Number.isNaN(due.getTime()) && due >= now && due <= nextWeek;
  }).length;
  const submissionLookup = Object.fromEntries(
    submissions.map((submission) => [submission.assignment_id, submission])
  );

  const pendingCount = assignments.filter((assignment) => {
    const submission = submissionLookup[assignment.id];
    if (submission) return false;
    const due = new Date(assignment.due_date);
    return Number.isNaN(due.getTime()) ? true : due >= new Date();
  }).length;

  const completedCount = submissions.filter(
    (submission) => submission.graded_at || typeof submission.score === 'number'
  ).length;

  const getStatus = (assignmentId: string, dueDate: string) => {
    const submission = submissionLookup[assignmentId];
    if (submission) {
      if (submission.graded_at || typeof submission.score === 'number') {
        return { label: 'Completed', variant: 'success' as const, detail: 'Graded' };
      }
      const due = new Date(dueDate);
      const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
      if (submittedAt && !Number.isNaN(submittedAt.getTime()) && !Number.isNaN(due.getTime())) {
        if (submittedAt > due) {
          return { label: 'Late', variant: 'destructive' as const, detail: 'Submitted late' };
        }
      }
      return { label: 'Submitted', variant: 'muted' as const, detail: 'On time' };
    }
    const due = new Date(dueDate);
    if (!Number.isNaN(due.getTime()) && due < new Date()) {
      return { label: 'Late', variant: 'destructive' as const, detail: 'Overdue' };
    }
    return { label: 'Pending', variant: 'outline' as const, detail: 'Not submitted' };
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Assignments" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Assignments" description="Track submission dates and requirements." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Pending', value: `${pendingCount}`, note: 'Awaiting submission' },
            { label: 'Completed', value: `${completedCount}`, note: 'Graded assignments' },
            { label: 'Due this week', value: `${dueThisWeek}`, note: 'Next 7 days' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                <div className="mt-1 text-xs text-neutral-500">{stat.note}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white p-4 md:flex-row md:items-center md:justify-between">
          <Input placeholder="Search assignments" className="md:w-72" />
          <div className="flex flex-wrap gap-2">
            <Badge>Due soon</Badge>
            <Badge variant="outline">This week</Badge>
            <Badge variant="outline">High score</Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {assignments.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-500 shadow-sm">
                No assignments found.
              </div>
            ) : (
              assignments.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card className="h-full border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="space-y-2 border-b border-[rgba(15,23,42,0.06)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base text-neutral-900">{assignment.title}</CardTitle>
                          <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
                            {subjectLookup[assignment.subject_id] ?? 'General'}
                          </div>
                        </div>
                        <Badge variant={getStatus(assignment.id, assignment.due_date).variant}>
                          {getStatus(assignment.id, assignment.due_date).label}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Due {new Date(assignment.due_date).toLocaleDateString()} · {getStatus(assignment.id, assignment.due_date).detail}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-neutral-600">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Total points</div>
                          <div className="mt-1 text-lg font-semibold text-neutral-900">{assignment.total_points}</div>
                        </div>
                        <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Your status</div>
                          <div className="mt-1 text-sm font-semibold text-neutral-900">
                            {submissionLookup[assignment.id]?.submitted_at
                              ? `Submitted ${new Date(submissionLookup[assignment.id].submitted_at).toLocaleDateString()}`
                              : 'Not submitted yet'}
                          </div>
                          {typeof submissionLookup[assignment.id]?.score === 'number' ? (
                            <div className="text-xs text-neutral-500">Score: {submissionLookup[assignment.id].score}</div>
                          ) : null}
                        </div>
                      </div>
                      {submissionLookup[assignment.id]?.submission_text ? (
                        <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3 text-xs text-neutral-600">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Answer preview</div>
                          <div className="mt-1">
                            {submissionLookup[assignment.id]?.submission_text?.slice(0, 120)}
                            {submissionLookup[assignment.id]?.submission_text?.length &&
                            submissionLookup[assignment.id]!.submission_text!.length > 120
                              ? '…'
                              : ''}
                          </div>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Keep your work organized in one place.</span>
                        <Link
                          href={`/dashboard/student/assignments/${assignment.id}`}
                          className="font-medium text-[var(--brand-blue-deep)] hover:underline"
                        >
                          Open
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {['Draft complete', 'Citations added', 'Format reviewed'].map((item) => (
                  <div key={item} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                    {item}
                  </div>
                ))}
                <Button size="sm">Upload latest draft</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Grading focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div>Prioritize the essay draft due on Friday.</div>
                <div>Allocate 45 mins for algebra practice.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
