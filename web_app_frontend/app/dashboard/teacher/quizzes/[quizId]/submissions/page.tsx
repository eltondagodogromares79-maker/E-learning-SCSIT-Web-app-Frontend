'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorLog } from '@/types';

export default function TeacherQuizSubmissionsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { data: quiz } = useQuiz(quizId);
  const { data: attempts = [] } = useQuizAttempts(quizId);
  const [query, setQuery] = useState('');
  const [violationsByAttempt, setViolationsByAttempt] = useState<
    Record<
      string,
      {
        count: number;
        lastDetail?: string | null;
        lastAt?: string | null;
        timeline?: Array<{ id: string; detail?: string | null; created_at: string; snapshots: QuizProctorLog['snapshots'] }>;
      }
    >
  >({});
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const violationsRef = useRef<
    Record<
      string,
      {
        count: number;
        lastDetail?: string | null;
        lastAt?: string | null;
        timeline?: Array<{ id: string; detail?: string | null; created_at: string; snapshots: QuizProctorLog['snapshots'] }>;
      }
    >
  >({});

  useEffect(() => {
    violationsRef.current = violationsByAttempt;
  }, [violationsByAttempt]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (!trimmed) return true;
      const haystack = [attempt.student_name, attempt.student_id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [attempts, query]);

  useEffect(() => {
    let active = true;
    const loadViolations = async () => {
      if (!quizId || filtered.length === 0) return;
      const missing = filtered.filter((attempt) => violationsRef.current[attempt.id] === undefined);
      if (missing.length === 0) return;
      setLoadingViolations(true);
      try {
        const results = await Promise.all(
          missing.map(async (attempt) => {
            try {
              const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
              const eventsWithContext =
                logs?.flatMap((log) =>
                  (log.events ?? [])
                    .filter((event) => event.type === 'violation')
                    .map((event) => ({
                      id: event.id,
                      detail: event.detail,
                      created_at: event.created_at,
                      snapshots: log.snapshots ?? [],
                    }))
                ) ?? [];
              const count = eventsWithContext.length;
              const lastEvent = eventsWithContext.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];
              return {
                id: attempt.id,
                count,
                lastDetail: lastEvent?.detail ?? null,
                lastAt: lastEvent?.created_at ?? null,
                timeline: eventsWithContext,
              };
            } catch {
              return { id: attempt.id, count: 0, lastDetail: null, lastAt: null, timeline: [] };
            }
          })
        );
        if (!active) return;
        setViolationsByAttempt((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            next[item.id] = {
              count: item.count,
              lastDetail: item.lastDetail,
              lastAt: item.lastAt,
              timeline: item.timeline ?? [],
            };
          });
          return next;
        });
      } finally {
        if (active) setLoadingViolations(false);
      }
    };
    loadViolations();
    return () => {
      active = false;
    };
  }, [filtered, quizId]);

  const handleToggleDetails = (attemptId: string) => {
    if (expandedAttemptId === attemptId) {
      setExpandedAttemptId(null);
      return;
    }
    setExpandedAttemptId(attemptId);
  };

  const formatDuration = (startedAt?: string, submittedAt?: string) => {
    if (!startedAt || !submittedAt) return '—';
    const start = new Date(startedAt).getTime();
    const end = new Date(submittedAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
    const totalSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const summary = useMemo(() => {
    let submitted = 0;
    let inProgress = 0;
    let feedbackRequired = 0;
    attempts.forEach((attempt) => {
      if (attempt.submitted_at) submitted += 1;
      else inProgress += 1;
      const needsFeedback = attempt.answers?.some(
        (answer) =>
          (answer.question_type === 'essay' || answer.question_type === 'identification') &&
          Boolean(answer.text_answer) &&
          !answer.feedback
      );
      if (needsFeedback) feedbackRequired += 1;
    });
    return { submitted, inProgress, feedbackRequired };
  }, [attempts]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Quiz submissions" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Quiz submissions"
          description="Review student attempts and open answer sheets."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button as={Link} href="/dashboard/teacher/quizzes" variant="secondary">
                Back to quizzes
              </Button>
              <Button as={Link} href={`/dashboard/teacher/quizzes/${quizId}`} variant="outline">
                Manage quiz
              </Button>
            </div>
          }
        />

        <Card className="border border-[rgba(30,79,214,0.12)] bg-gradient-to-br from-white via-white to-blue-50/60">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Attempts</CardTitle>
            <Input
              placeholder="Search student"
              className="md:w-72"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Submitted', value: summary.submitted, accent: 'text-emerald-700' },
                { label: 'In progress', value: summary.inProgress, accent: 'text-amber-700' },
                { label: 'Feedback required', value: summary.feedbackRequired, accent: 'text-rose-700' },
                { label: 'Total points', value: quiz?.total_points ?? 0, accent: 'text-slate-700' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-neutral-200/70 bg-white/90 p-3 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.45)]"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{item.label}</div>
                  <div className={`mt-1 text-2xl font-semibold ${item.accent}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No submissions yet.
              </div>
            ) : (
              filtered.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className={`rounded-2xl border border-neutral-200/70 p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.45)] ${
                    index % 2 === 0 ? 'bg-white/95' : 'bg-blue-50/40'
                  }`}
                >
                  {(() => {
                    const totalPoints =
                      typeof quiz?.total_points === 'number'
                        ? quiz.total_points
                        : attempt.answers?.reduce((sum, answer) => sum + (answer.question_points ?? 0), 0) ?? 0;
                    return (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-[var(--brand-blue-deep)]"
                      >
                        {attempt.student_name ?? attempt.student_id}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span
                          className={`rounded-full border px-2 py-0.5 ${
                            attempt.submitted_at ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {attempt.submitted_at ? 'Submitted' : 'In progress'}
                        </span>
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                          Duration: {formatDuration(attempt.started_at, attempt.submitted_at)}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 ${
                            (violationsByAttempt[attempt.id]?.count ?? 0) > 0
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-neutral-200 bg-neutral-50'
                          }`}
                        >
                          Violations:{' '}
                          {loadingViolations && violationsByAttempt[attempt.id] === undefined
                            ? '…'
                            : violationsByAttempt[attempt.id]?.count ?? 0}
                        </span>
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : null}
                      </div>
                      {violationsByAttempt[attempt.id]?.count ? (
                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/80 p-2 text-[11px] text-rose-700">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-rose-500">
                            Violations timeline
                          </div>
                          <div className="mt-2 space-y-2">
                            {violationsByAttempt[attempt.id]?.timeline?.map((event, index) => (
                              <div
                                key={`${event.id}-${index}`}
                                className="rounded-md border border-rose-200/70 bg-rose-50 p-2"
                              >
                                <div className="font-semibold text-rose-700">Violation</div>
                                <div className="mt-1">{event.detail ?? 'Violation recorded.'}</div>
                                <div className="mt-1 text-[10px] text-rose-400">
                                  {new Date(event.created_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {attempt.answers?.some(
                        (answer) =>
                          (answer.question_type === 'essay' || answer.question_type === 'identification') &&
                          Boolean(answer.text_answer) &&
                          !answer.feedback
                      ) ? (
                        <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Feedback required
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="mr-2 text-right">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Score</div>
                        <div className="text-lg font-semibold text-neutral-900">
                          {attempt.score ?? 0} / {totalPoints}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        as={Link}
                        href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
                      >
                        Review answers
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleDetails(attempt.id)}
                      >
                        {expandedAttemptId === attempt.id ? 'Hide violations' : 'View violations'}
                      </Button>
                    </div>
                  </div>
                    );
                  })()}
                  {expandedAttemptId === attempt.id ? (
                    <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/60 p-3">
                      {loadingViolations && violationsByAttempt[attempt.id] === undefined ? (
                        <div className="text-xs text-neutral-500">Loading violations…</div>
                      ) : (() => {
                        const timeline = violationsByAttempt[attempt.id]?.timeline ?? [];
                        if (timeline.length === 0) {
                          return <div className="text-xs text-neutral-500">No violations recorded.</div>;
                        }
                        return (
                          <div className="space-y-2">
                            {timeline.map((event, idx) => (
                              <div key={`${event.id}-${idx}`} className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                                <div className="flex-1 rounded-xl border border-rose-200/70 bg-white p-2">
                                  <div className="text-[11px] uppercase tracking-[0.2em] text-rose-600">Violation</div>
                                  <div className="mt-1 text-xs text-neutral-700">{event.detail ?? 'Policy warning issued.'}</div>
                                  <div className="mt-1 text-[10px] text-rose-400">
                                    {new Date(event.created_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
