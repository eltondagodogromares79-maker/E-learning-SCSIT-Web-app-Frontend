'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorLog, Question } from '@/types';
import { useToast } from '@/components/ui/toast';
import type { QuizAttempt } from '@/types';

export default function QuizAttemptReviewPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();
  const { showToast } = useToast();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);
  const [aiGradingAnswerId, setAiGradingAnswerId] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState<number | null>(null);
  const [violationTimeline, setViolationTimeline] = useState<Array<{ detail?: string | null; created_at: string }>>([]);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [answerFeedbackDrafts, setAnswerFeedbackDrafts] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswerId, setPreviewAnswerId] = useState<string | null>(null);
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const manualAnswers = useMemo(
    () =>
      (attempt?.answers ?? []).filter(
        (answer) => answer.question_type === 'essay' || answer.question_type === 'identification'
      ),
    [attempt?.answers]
  );
  const reviewItems = useMemo(() => {
    if (quizQuestions.length > 0) {
      return quizQuestions.map((question) => {
        const answer = attempt?.answers?.find((item) => item.question_id === question.id);
        return { question, answer };
      });
    }
    return (attempt?.answers ?? []).map((answer) => ({
      question: {
        id: answer.question_id,
        question_text: answer.question_text ?? 'Question',
        question_type: (answer.question_type as Question['question_type']) ?? 'essay',
        points: answer.question_points ?? 0,
      },
      answer,
    }));
  }, [attempt?.answers, quizQuestions]);

  const loadAttempt = async () => {
    if (!attemptId) return;
    setLoading(true);
    try {
      const data = await quizService.getAttempt(attemptId);
      setAttempt(data);
      setFeedbackDraft(data.feedback ?? '');
      try {
        const quizData = await quizService.get(data.quiz_id);
        setQuizQuestions(quizData?.questions ?? []);
      } catch {
        setQuizQuestions([]);
      }
      try {
        const logs: QuizProctorLog[] = await quizService.getProctorLogs({ quiz_id: data.quiz_id, attempt_id: data.id });
        const count = logs.reduce(
          (sum, log) => sum + (log.events?.filter((event) => event.type === 'violation').length ?? 0),
          0
        );
        setViolationCount(count);
        const timeline = logs
          .flatMap((log) => log.events ?? [])
          .filter((event) => event.type === 'violation')
          .map((event) => ({ detail: event.detail, created_at: event.created_at }))
          .slice(0, 6);
        setViolationTimeline(timeline);
      } catch {
        setViolationCount(null);
        setViolationTimeline([]);
      }
      setScoreDrafts((prev) => {
        const next = { ...prev };
        data.answers?.forEach((answer) => {
          if (answer.question_type === 'essay' || answer.question_type === 'identification') {
            if (next[answer.id] === undefined) {
              next[answer.id] = answer.points_earned?.toString() ?? '';
            }
          }
        });
        return next;
      });
      setAnswerFeedbackDrafts((prev) => {
        const next = { ...prev };
        data.answers?.forEach((answer) => {
          if (answer.question_type === 'essay' || answer.question_type === 'identification') {
            if (next[answer.id] === undefined) {
              next[answer.id] = answer.feedback ?? '';
            }
          }
        });
        return next;
      });
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message ?? 'Unable to load attempt.';
      showToast({ title: 'Load failed', description: apiError, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const handleSaveAll = async () => {
    if (!attempt) return;
    const payload = manualAnswers
      .map((answer) => {
        const raw = scoreDrafts[answer.id];
        const value = Number(raw);
        const feedback = answerFeedbackDrafts[answer.id] ?? '';
        if (Number.isNaN(value) && !feedback.trim()) return null;
        return {
          answer_id: answer.id,
          points_earned: Number.isNaN(value) ? null : value,
          feedback,
        };
      })
      .filter(Boolean) as Array<{ answer_id: string; points_earned: number | null; feedback?: string }>;
    if (payload.length === 0) {
      showToast({ title: 'Nothing to save', description: 'Enter scores for essay/identification answers.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await quizService.gradeAnswers(attempt.id, payload);
      await loadAttempt();
      showToast({ title: 'Scores saved', description: 'Manual scores were updated.', variant: 'success' });
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message ?? 'Unable to save scores.';
      showToast({ title: 'Save failed', description: apiError, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAiGrade = async () => {
    if (!attempt) return;
    setAiGrading(true);
    try {
      await quizService.aiGradeAttempt(attempt.id);
      await loadAttempt();
      showToast({ title: 'AI grading complete', description: 'Scores updated from AI review.', variant: 'success' });
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message ?? 'AI grading failed.';
      showToast({ title: 'AI grade failed', description: apiError, variant: 'error' });
    } finally {
      setAiGrading(false);
    }
  };

  const handleAiGradeEssay = async () => {
    if (!attempt) return;
    setAiGrading(true);
    try {
      await quizService.aiGradeEssayAnswers(attempt.id);
      await loadAttempt();
      showToast({ title: 'AI grading complete', description: 'Essay answers updated.', variant: 'success' });
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message ?? 'AI grading failed.';
      showToast({ title: 'AI grade failed', description: apiError, variant: 'error' });
    } finally {
      setAiGrading(false);
    }
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Quiz review" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Answer review"
          description="Manually score essay and identification responses."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
              <Button variant="outline" as={Link} href="/dashboard/teacher/quizzes">
                Back to quizzes
              </Button>
              {attempt?.quiz_id ? (
                <Button variant="outline" as={Link} href={`/dashboard/teacher/quizzes/${attempt.quiz_id}`}>
                  Back to quiz
                </Button>
              ) : null}
              {attempt?.section_subject_id ? (
                <Button variant="outline" as={Link} href={`/dashboard/teacher/classes/${attempt.section_subject_id}`}>
                  Back to class submissions
                </Button>
              ) : null}
              <Button variant="outline" onClick={handleAiGrade} disabled={aiGrading || loading}>
                {aiGrading ? 'AI grading…' : 'AI grade'}
              </Button>
              <Button variant="outline" onClick={handleAiGradeEssay} disabled={aiGrading || loading}>
                {aiGrading ? 'AI grading…' : 'AI grade essays'}
              </Button>
              <Button onClick={handleSaveAll} disabled={saving || loading}>
                {saving ? 'Saving…' : 'Save all scores'}
              </Button>
            </div>
          }
        />

        <Card className="border border-[rgba(30,79,214,0.12)] bg-gradient-to-br from-white via-white to-blue-50/70">
          <CardHeader>
            <CardTitle>Attempt summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-neutral-600 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Student</div>
              <div className="mt-1 text-lg font-semibold text-neutral-900">
                {attempt?.student_name ?? attempt?.student_id ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Quiz</div>
              <div className="mt-1 text-lg font-semibold text-neutral-900">{attempt?.quiz_title ?? 'Quiz'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Submitted</div>
              <div className="mt-1 text-sm text-neutral-700">
                {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'In progress'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Raw {attempt?.raw_score ?? 0}</Badge>
              <Badge>Final {attempt?.score ?? 0}</Badge>
              {violationCount !== null ? (
                <Badge variant={violationCount > 0 ? 'destructive' : 'outline'}>
                  Violations {violationCount}
                </Badge>
              ) : null}
              {attempt?.ai_grade_failed ? (
                <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
                  Needs manual grading (AI failed)
                </Badge>
              ) : attempt?.ai_grade_applied ? (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">AI graded</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[rgba(30,79,214,0.12)] bg-white/90">
          <CardHeader>
            <CardTitle>Violations timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-neutral-600">
            {violationTimeline.length === 0 ? (
              <div className="text-xs text-neutral-500">No violations recorded.</div>
            ) : (
              violationTimeline.map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                  <div className="flex-1 rounded-xl border border-rose-200/70 bg-rose-50/60 p-2">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-rose-600">Violation</div>
                    <div className="mt-1 text-neutral-700">{event.detail ?? 'Policy warning issued.'}</div>
                    <div className="mt-1 text-[10px] text-neutral-400">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-[rgba(30,79,214,0.12)] bg-white/90">
          <CardHeader>
            <CardTitle>Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-neutral-500">Loading answers…</div>
            ) : reviewItems.length ? (
              reviewItems.map(({ question, answer }) => {
                const questionType = question.question_type ?? 'essay';
                const isManual = questionType === 'essay' || questionType === 'identification';
                const answerText = answer?.selected_choice_text ?? answer?.text_answer ?? 'No answer submitted.';
                const isCorrect =
                  typeof answer?.is_correct === 'boolean'
                    ? answer.is_correct
                    : typeof answer?.selected_choice_is_correct === 'boolean'
                    ? answer.selected_choice_is_correct
                    : undefined;
                const isAuto =
                  questionType === 'multiple_choice' || questionType === 'true_false';
                const showCorrectLabel = isAuto;
                const needsManual =
                  !isAuto &&
                  Boolean(answer?.text_answer) &&
                  (answer?.points_earned ?? 0) === 0;
                return (
                  <div
                    key={answer?.id ?? question.id}
                    className={`rounded-2xl border p-4 ${
                      isManual ? 'border-amber-200/70 bg-amber-50/40' : 'border-neutral-200/70 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                          {questionType}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-neutral-900">
                          {question.question_text ?? 'Question'}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">Max {question.points ?? 0} pts</div>
                    </div>
                    <div className="mt-2 text-sm">{answerText}</div>
                    {answer?.feedback ? (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Feedback</div>
                        <div className="mt-1 whitespace-pre-wrap">{answer.feedback}</div>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-neutral-500">
                        Points: {answer?.points_earned ?? 0} / {question.points ?? 0}
                        {showCorrectLabel && typeof isCorrect === 'boolean' ? (
                          <span className={`ml-2 font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                        ) : null}
                        {!showCorrectLabel && (answer?.points_earned ?? 0) > 0 ? (
                          <span className="ml-2 font-semibold text-emerald-600">Scored</span>
                        ) : null}
                        {!showCorrectLabel && needsManual ? (
                          <span className="ml-2 font-semibold text-amber-600">Not graded yet</span>
                        ) : null}
                      </div>
                      {isManual ? (
                        answer ? (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Score"
                              value={scoreDrafts[answer.id] ?? ''}
                              onChange={(event) =>
                                setScoreDrafts((prev) => ({ ...prev, [answer.id]: event.target.value }))
                              }
                              className="h-9 w-24 text-xs"
                            />
                            <Input
                              placeholder="Feedback"
                              value={answerFeedbackDrafts[answer.id] ?? ''}
                              onChange={(event) =>
                                setAnswerFeedbackDrafts((prev) => ({ ...prev, [answer.id]: event.target.value }))
                              }
                              className="h-9 w-56 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (!attempt) return;
                                const raw = scoreDrafts[answer.id];
                                const value = Number(raw);
                                const feedback = answerFeedbackDrafts[answer.id] ?? '';
                                if (Number.isNaN(value) && !feedback.trim()) return;
                                setSaving(true);
                                try {
                                  await quizService.gradeAnswers(attempt.id, [
                                    { answer_id: answer.id, points_earned: Number.isNaN(value) ? null : value, feedback },
                                  ]);
                                  await loadAttempt();
                                  showToast({ title: 'Score saved', description: 'Manual score updated.', variant: 'success' });
                                } catch (error: any) {
                                  const apiError =
                                    error?.response?.data?.error ?? error?.message ?? 'Unable to save score.';
                                  showToast({ title: 'Save failed', description: apiError, variant: 'error' });
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              disabled={saving}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                if (!attempt) return;
                                setPreviewAnswerId(answer.id);
                                setPreviewScore(null);
                                setPreviewFeedback('');
                                setPreviewOpen(true);
                                setPreviewLoading(true);
                                try {
                                  const preview = await quizService.aiPreviewAnswer(attempt.id, answer.id);
                                  setPreviewScore(preview.score);
                                  setPreviewFeedback(preview.feedback);
                                } catch (error: any) {
                                  const apiError =
                                    error?.response?.data?.error ?? error?.message ?? 'AI preview failed.';
                                  showToast({ title: 'AI preview failed', description: apiError, variant: 'error' });
                                  setPreviewOpen(false);
                                } finally {
                                  setPreviewLoading(false);
                                }
                              }}
                              disabled={aiGradingAnswerId === answer.id || !answer.text_answer}
                            >
                              {aiGradingAnswerId === answer.id ? 'AI grading…' : 'AI preview'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-500">No answer submitted.</div>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-neutral-500">No answers found.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[rgba(30,79,214,0.12)] bg-white/90">
          <CardHeader>
            <CardTitle>Teacher feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              placeholder="Write feedback for the student..."
              value={feedbackDraft}
              onChange={(event) => setFeedbackDraft(event.target.value)}
            />
            <div>
              <Button
                onClick={async () => {
                  if (!attempt) return;
                  setSavingFeedback(true);
                  try {
                    await quizService.updateAttempt(attempt.id, { feedback: feedbackDraft.trim() });
                    await loadAttempt();
                    showToast({ title: 'Feedback saved', description: 'Student feedback updated.', variant: 'success' });
                  } catch (error: any) {
                    const apiError = error?.response?.data?.error ?? error?.message ?? 'Unable to save feedback.';
                    showToast({ title: 'Save failed', description: apiError, variant: 'error' });
                  } finally {
                    setSavingFeedback(false);
                  }
                }}
                disabled={savingFeedback}
              >
                {savingFeedback ? 'Saving…' : 'Save feedback'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI feedback preview</DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="text-sm text-neutral-500">Generating preview…</div>
          ) : (
            <div className="space-y-3 text-sm text-neutral-700">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Score</div>
                <div className="mt-1 text-lg font-semibold text-neutral-900">{previewScore ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Feedback</div>
                <div className="mt-1 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
                  {previewFeedback || 'No feedback generated.'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    if (!attempt || !previewAnswerId) return;
                    setAiGradingAnswerId(previewAnswerId);
                    try {
                      await quizService.aiGradeAnswer(attempt.id, previewAnswerId);
                      await loadAttempt();
                      setPreviewOpen(false);
                      showToast({ title: 'AI graded', description: 'Answer updated.', variant: 'success' });
                    } catch (error: any) {
                      const apiError = error?.response?.data?.error ?? error?.message ?? 'AI grading failed.';
                      showToast({ title: 'AI grade failed', description: apiError, variant: 'error' });
                    } finally {
                      setAiGradingAnswerId(null);
                    }
                  }}
                  disabled={aiGradingAnswerId === previewAnswerId}
                >
                  Apply AI feedback
                </Button>
                <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
