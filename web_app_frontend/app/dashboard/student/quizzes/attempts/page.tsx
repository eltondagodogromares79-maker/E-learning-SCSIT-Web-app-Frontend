'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorLog } from '@/types';

export default function StudentQuizAttemptsPage() {
  const searchParams = useSearchParams();
  const filterQuizId = searchParams.get('quizId') ?? '';
  const { data: attempts = [] } = useQuizAttempts();
  const [query, setQuery] = useState('');
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [logsByAttempt, setLogsByAttempt] = useState<Record<string, QuizProctorLog[]>>({});
  const [loadingAttemptId, setLoadingAttemptId] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceSnapshots, setEvidenceSnapshots] = useState<QuizProctorLog['snapshots']>([]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (filterQuizId && attempt.quiz_id !== filterQuizId) return false;
      if (!trimmed) return true;
      const haystack = [attempt.quiz_title, attempt.quiz_id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [attempts, query, filterQuizId]);

  const handleToggleDetails = async (attemptId: string, quizId: string) => {
    if (expandedAttemptId === attemptId) {
      setExpandedAttemptId(null);
      return;
    }
    setExpandedAttemptId(attemptId);
    if (logsByAttempt[attemptId]) return;
    setLoadingAttemptId(attemptId);
    try {
      const data = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attemptId });
      setLogsByAttempt((prev) => ({ ...prev, [attemptId]: data ?? [] }));
    } catch (error) {
      setLogsByAttempt((prev) => ({ ...prev, [attemptId]: [] }));
    } finally {
      setLoadingAttemptId(null);
    }
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Quiz Attempts" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Quiz attempts" description="Audit your quiz submissions and penalties." />
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Attempts</CardTitle>
            <Input
              placeholder="Search quiz"
              className="md:w-72"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No attempts yet.
              </div>
            ) : (
              filtered.map((attempt) => (
                <div key={attempt.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{attempt.quiz_title ?? 'Quiz'}</div>
                      <div className="text-xs text-neutral-500">
                        {attempt.submitted_at ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}` : 'In progress'}
                      </div>
                    </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="outline">Raw {attempt.raw_score ?? 0}</Badge>
                    <Badge variant="outline">Penalty {attempt.penalty_percent ?? 0}%</Badge>
                    <Badge variant="outline">Final {attempt.score ?? 0}</Badge>
                    {attempt.feedback ? (
                      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Feedback</Badge>
                    ) : null}
                    {logsByAttempt[attempt.id] ? (
                      <Badge className="border border-rose-200 bg-rose-50 text-rose-600">
                        Warnings{' '}
                          {logsByAttempt[attempt.id]
                            .flatMap((log) => log.events ?? [])
                            .filter((event) => event.type === 'violation').length}
                        </Badge>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                        onClick={() => handleToggleDetails(attempt.id, attempt.quiz_id)}
                      >
                        {expandedAttemptId === attempt.id ? 'Hide details' : 'View warnings'}
                      </button>
                    </div>
                  </div>
                  {expandedAttemptId === attempt.id && (
                    <div className="mt-4 space-y-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-3">
                      {attempt.feedback ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-700">Teacher feedback</div>
                          <div className="mt-2 whitespace-pre-wrap">{attempt.feedback}</div>
                        </div>
                      ) : null}
                      {attempt.answers && attempt.answers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-neutral-700">Answer feedback</div>
                          {attempt.answers.map((answer) => {
                            const answerText = answer.selected_choice_text ?? answer.text_answer ?? 'No answer text';
                            const isCorrect =
                              typeof answer.is_correct === 'boolean'
                                ? answer.is_correct
                                : typeof answer.selected_choice_is_correct === 'boolean'
                                ? answer.selected_choice_is_correct
                                : undefined;
                            const isAuto =
                              answer.question_type === 'multiple_choice' || answer.question_type === 'true_false';
                            const hasManualScore =
                              answer.points_earned !== undefined && answer.points_earned !== null;
                            const showCorrectLabel = isAuto;
                            return (
                              <div key={answer.id} className="rounded-xl border border-neutral-200 bg-white p-3 text-xs">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                                  {answer.question_type ?? 'Question'}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-neutral-900">{answer.question_text ?? 'Answer'}</div>
                                <div className="mt-1 text-neutral-700">{answerText}</div>
                                <div className="mt-2 text-[11px] text-neutral-500">
                                  Points: {answer.points_earned ?? 0} / {answer.question_points ?? 0}
                                  {showCorrectLabel && typeof isCorrect === 'boolean' ? (
                                    <span className={`ml-2 font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {isCorrect ? 'Correct' : 'Wrong'}
                                    </span>
                                  ) : null}
                                  {!showCorrectLabel && !isAuto && hasManualScore ? (
                                    <span className="ml-2 font-semibold text-emerald-600">Scored</span>
                                  ) : null}
                                  {!showCorrectLabel && !isAuto && !hasManualScore ? (
                                    <span className="ml-2 font-semibold text-amber-600">Not graded yet</span>
                                  ) : null}
                                </div>
                                {answer.feedback ? (
                                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2 text-[11px] text-emerald-900">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Feedback</div>
                                    <div className="mt-1 whitespace-pre-wrap">{answer.feedback}</div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="text-xs font-semibold text-neutral-700">Warning history</div>
                      {loadingAttemptId === attempt.id ? (
                        <div className="text-xs text-neutral-500">Loading warnings…</div>
                      ) : (
                        (() => {
                          const logs = logsByAttempt[attempt.id] ?? [];
                          const totalWarnings = logs
                            .flatMap((log) => log.events ?? [])
                            .filter((event) => event.type === 'violation').length;
                          if (totalWarnings === 0) {
                            return <div className="text-xs text-neutral-500">No warnings recorded for this attempt.</div>;
                          }
                          return (
                            <div className="space-y-3">
                              {logs.map((log) => {
                                const warningEvents = (log.events ?? []).filter((event) => event.type === 'violation');
                                if (warningEvents.length === 0) return null;
                                return (
                                  <div key={log.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                                      <div className="font-semibold text-neutral-700">
                                        Session {new Date(log.started_at).toLocaleString()}
                                      </div>
                                      <Badge variant="outline">{warningEvents.length} warnings</Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {warningEvents.map((event) => (
                                        <div key={event.id} className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                                          <div className="font-semibold text-neutral-700">Violation</div>
                                          <div>{event.detail ?? 'Policy warning issued.'}</div>
                                          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-neutral-400">
                                            <span>{new Date(event.created_at).toLocaleString()}</span>
                                            <button
                                              type="button"
                                              className="rounded-full border border-[rgba(15,23,42,0.12)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                                              onClick={() => {
                                                setEvidenceSnapshots(log.snapshots ?? []);
                                                setEvidenceTitle(`Evidence for ${attempt.quiz_title ?? 'Quiz'}`);
                                                setEvidenceOpen(true);
                                              }}
                                            >
                                              View evidence
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{evidenceTitle || 'Evidence'}</DialogTitle>
            </DialogHeader>
            {evidenceSnapshots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No snapshots available for this warning.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {evidenceSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                    <img
                      src={snapshot.image_url}
                      alt={snapshot.reason ?? 'Evidence snapshot'}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <div className="mt-2 text-xs font-semibold text-neutral-700">{snapshot.reason ?? 'Snapshot'}</div>
                    <div className="text-[11px] text-neutral-400">{new Date(snapshot.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
