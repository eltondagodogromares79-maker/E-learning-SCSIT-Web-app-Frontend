'use client';

import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import Link from 'next/link';

export default function StudentQuizzesPage() {
  const { data: quizzes = [] } = useQuizzes();
  const { data: attempts = [] } = useQuizAttempts();
  const { data: subjects = [] } = useSubjects();
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.id, subject.name]));
  const submittedByQuizId = attempts.reduce<Record<string, boolean>>((acc, attempt) => {
    if (attempt.submitted_at) {
      acc[attempt.quiz_id] = true;
    }
    return acc;
  }, {});
  const attemptsByQuizId = attempts.reduce<Record<string, number>>((acc, attempt) => {
    acc[attempt.quiz_id] = (acc[attempt.quiz_id] ?? 0) + 1;
    return acc;
  }, {});
  const latestAttemptByQuizId = attempts.reduce<Record<string, { score: number; submitted_at?: string }>>((acc, attempt) => {
    if (!attempt.submitted_at) return acc;
    const existing = acc[attempt.quiz_id];
    if (!existing) {
      acc[attempt.quiz_id] = { score: attempt.score ?? 0, submitted_at: attempt.submitted_at };
      return acc;
    }
    const existingDate = new Date(existing.submitted_at ?? 0).getTime();
    const nextDate = new Date(attempt.submitted_at ?? 0).getTime();
    if (nextDate > existingDate) {
      acc[attempt.quiz_id] = { score: attempt.score ?? 0, submitted_at: attempt.submitted_at };
    }
    return acc;
  }, {});
  const upcomingQuiz = quizzes
    .filter((quiz) => quiz.due_date)
    .slice()
    .sort((a, b) => new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime())[0];
  const recentAttempts = attempts
    .filter((attempt) => attempt.submitted_at)
    .slice()
    .sort(
      (a, b) => new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime()
    )
    .slice(0, 3);
  const scoreSeries = attempts
    .filter((attempt) => attempt.submitted_at)
    .slice()
    .sort((a, b) => new Date(a.submitted_at ?? 0).getTime() - new Date(b.submitted_at ?? 0).getTime())
    .slice(-6)
    .map((attempt) => {
      const total = quizzes.find((quiz) => quiz.id === attempt.quiz_id)?.total_points ?? 0;
      return { score: attempt.score ?? 0, total };
    });

  return (
    <AppShell title="Student Dashboard" subtitle="Quizzes" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader title="Quizzes" description="Upcoming quiz schedules and attempts." />
          <Link
            href="/dashboard/student/quizzes/attempts"
            className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
          >
            View attempts
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Upcoming quizzes', value: '2', note: 'Next in 3 days' },
            { label: 'Average score', value: '87%', note: 'Above class avg' },
            { label: 'Attempts left', value: '3', note: 'Use wisely' },
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
          <Input placeholder="Search quizzes" className="md:w-72" />
          <div className="flex flex-wrap gap-2">
            <Badge>Upcoming</Badge>
            <Badge variant="outline">Timed</Badge>
            <Badge variant="outline">Multiple attempts</Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {quizzes.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                No quizzes found.
              </div>
            ) : (
              quizzes.map((quiz) => {
                const attemptsUsed = attemptsByQuizId[quiz.id] ?? 0;
                const attemptsRemaining = Math.max(quiz.attempt_limit - attemptsUsed, 0);
                const dueDate = quiz.due_date ? new Date(quiz.due_date) : null;
                const isOverdue = Boolean(dueDate && dueDate.getTime() < Date.now() && !submittedByQuizId[quiz.id]);
                return (
                <motion.div
                  key={quiz.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card className={`h-full ${isOverdue ? 'border-rose-200 bg-rose-50/40' : ''}`}>
                    <CardHeader>
                      <CardTitle>{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-neutral-600">
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {quiz.subject_name ?? subjectLookup[quiz.subject_id] ?? 'General'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{quiz.time_limit_minutes ?? 20} mins</Badge>
                        <Badge variant="muted">
                          Attempts: {attemptsByQuizId[quiz.id] ?? 0} / {quiz.attempt_limit}
                        </Badge>
                        <Badge variant="outline">Remaining: {attemptsRemaining}</Badge>
                        {quiz.is_available === false ? (
                          <Badge variant="outline">Not available</Badge>
                        ) : isOverdue ? (
                          <Badge className="border border-rose-200 bg-rose-50 text-rose-700">Overdue</Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Due {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : 'TBA'}
                      </div>
                      {quiz.is_available === false ? (
                        <span className="inline-flex items-center justify-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-neutral-400">
                          Not available
                        </span>
                      ) : submittedByQuizId[quiz.id] ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Submitted
                          </span>
                          <span className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
                            Score {latestAttemptByQuizId[quiz.id]?.score ?? 0} / {quiz.total_points}
                          </span>
                          <Link
                            href={`/dashboard/student/quizzes/attempts?quizId=${quiz.id}`}
                            className="inline-flex items-center justify-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                          >
                            View submissions
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/student/quizzes/${quiz.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                        >
                          Start quiz
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
              })
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next quiz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                {upcomingQuiz ? (
                  <>
                    <div className="text-sm font-semibold text-neutral-900">{upcomingQuiz.title}</div>
                    <div>
                      Due {upcomingQuiz.due_date ? new Date(upcomingQuiz.due_date).toLocaleDateString() : 'TBA'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {upcomingQuiz.subject_name ?? subjectLookup[upcomingQuiz.subject_id] ?? 'General'}
                    </div>
                    <Button size="sm" as={Link} href={`/dashboard/student/quizzes/${upcomingQuiz.id}`}>
                      Open quiz
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-neutral-500">No upcoming quizzes.</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                {recentAttempts.length === 0 ? (
                  <div className="text-sm text-neutral-500">No submissions yet.</div>
                ) : (
                  recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                      <div className="text-sm font-semibold text-neutral-900">{attempt.quiz_title ?? 'Quiz'}</div>
                      <div className="text-xs text-neutral-500">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'In progress'}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Score {attempt.score ?? 0} / {quizzes.find((quiz) => quiz.id === attempt.quiz_id)?.total_points ?? 0}
                      </div>
                      <Link
                        href={`/dashboard/student/quizzes/attempts?quizId=${attempt.quiz_id}`}
                        className="mt-2 inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        View attempt
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Score trend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {scoreSeries.length === 0 ? (
                  <div className="text-sm text-neutral-500">No scores yet.</div>
                ) : (
                  <>
                    <div className="flex items-end gap-2">
                      {scoreSeries.map((entry, index) => {
                        const max = entry.total || 1;
                        const height = Math.max(8, Math.round((entry.score / max) * 60));
                        return (
                          <div key={`${entry.score}-${index}`} className="flex flex-col items-center gap-1">
                            <div
                              className="w-4 rounded-full bg-[var(--brand-blue-deep)]/80"
                              style={{ height }}
                            />
                            <div className="text-[10px] text-neutral-400">{entry.score}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-neutral-500">Latest 6 scores</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
