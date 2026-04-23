'use client';

import { use } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { CheckCircle, XCircle, ArrowLeft, Clock, Trophy, BookOpen, MessageSquare, Hash } from 'lucide-react';

export default function StudentQuizAnswersPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const { data: quiz } = useQuiz(quizId);
  const { data: attempts = [] } = useQuizAttempts();

  const attemptsForQuiz = attempts.filter(
    (a) => String(a.quiz_id) === String(quizId)
  );
  const latestAttempt = [...attemptsForQuiz].sort(
    (a, b) =>
      new Date(b.submitted_at ?? b.started_at ?? 0).getTime() -
      new Date(a.submitted_at ?? a.started_at ?? 0).getTime()
  )[0];
  const questionLookup = Object.fromEntries(
    (quiz?.questions ?? []).map((q: any) => [String(q.id), q])
  );

  const answers: any[] = latestAttempt?.answers ?? [];
  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.selected_choice_is_correct === true).length;
  const score = latestAttempt?.score ?? latestAttempt?.raw_score;
  const pct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : null;

  return (
    <AppShell title="Student Dashboard" subtitle="Quiz Answers" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Back ── */}
        <Button as={Link} href="/dashboard/student/quizzes" variant="ghost" size="sm"
          className="gap-2 text-neutral-500 hover:text-neutral-900 -ml-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quizzes
        </Button>

        {/* ── Hero banner ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
          style={{ background: 'var(--brand-blue)' }}
        >
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10" style={{ background: '#fff' }} />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full opacity-5" style={{ background: '#fff' }} />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/60">
                Quiz Review
              </p>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">
                {quiz?.title ?? 'Quiz Answers'}
              </h1>
              {latestAttempt?.submitted_at && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
                  <Clock className="h-4 w-4" />
                  Submitted {new Date(latestAttempt.submitted_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Score ring */}
            {latestAttempt && (
              <div className="flex shrink-0 items-center gap-6">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 px-8 py-5 text-center backdrop-blur-sm">
                  <Trophy className="mb-1 h-5 w-5 text-white/70" />
                  <div className="text-4xl font-extrabold text-white">
                    {score !== undefined && score !== null ? score : '—'}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-white/60">Score</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 px-8 py-5 text-center backdrop-blur-sm">
                  <BookOpen className="mb-1 h-5 w-5 text-white/70" />
                  <div className="text-4xl font-extrabold text-white">
                    {pct !== null ? `${pct}%` : '—'}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-white/60">
                    {correctCount}/{totalQuestions} correct
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── No submission ── */}
        {!latestAttempt ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-16 text-center text-neutral-400">
            No submission found for this quiz.
          </div>
        ) : answers.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-16 text-center text-neutral-400">
            No answers recorded for this submission.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 shadow-sm">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                    Teacher Feedback
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
                    {latestAttempt.feedback?.trim() || 'No overall feedback yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section label ── */}
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5" style={{ color: 'var(--brand-blue)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                Your Answers
              </h2>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: 'var(--brand-blue)' }}>
                {totalQuestions} questions
              </span>
            </div>

            {/* ── Question cards ── */}
            <div className="grid gap-5 lg:grid-cols-2">
              {answers.map((answer: any, index: number) => {
                const isEssay = answer.question_type === 'essay' || answer.question_type === 'identification';
                const isCorrect = answer.selected_choice_is_correct === true;
                const choices = questionLookup[String(answer.question)]?.choices ?? [];

                return (
                  <div
                    key={answer.id}
                    className="flex flex-col overflow-hidden rounded-2xl border"
                    style={{
                      background: 'var(--surface)',
                      borderColor: isEssay ? 'var(--border)' : isCorrect ? '#6ee7b7' : '#fda4af',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Card header */}
                    <div
                      className="flex items-start justify-between gap-4 px-6 py-5"
                      style={{
                        background: isEssay
                          ? 'var(--surface-2)'
                          : isCorrect
                            ? 'rgba(209,250,229,0.5)'
                            : 'rgba(255,228,230,0.5)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: 'var(--brand-blue)' }}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue)' }}>
                            {answer.question_type ?? 'question'}
                          </span>
                          <p className="text-base font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                            {answer.question_text ?? 'Question'}
                          </p>
                        </div>
                      </div>

                      {!isEssay && (
                        <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                          isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isCorrect
                            ? <CheckCircle className="h-4 w-4" />
                            : <XCircle className="h-4 w-4" />}
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col gap-4 px-6 py-5">
                      {isEssay ? (
                        <div
                          className="min-h-[80px] rounded-xl border px-4 py-3 text-sm leading-relaxed"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-2)' }}
                        >
                          {answer.text_answer || (
                            <span className="italic" style={{ color: 'var(--muted-foreground)' }}>No answer provided</span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {choices.map((choice: any) => {
                            const isSelected = String(choice.id) === String(answer.selected_choice);
                            const isChoiceCorrect = choice.is_correct;

                            return (
                              <div
                                key={choice.id}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-none ${
                                  isChoiceCorrect
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : isSelected
                                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                                      : 'border-neutral-200 bg-white text-neutral-600'
                                }`}
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                                  {isChoiceCorrect
                                    ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    : isSelected
                                      ? <XCircle className="h-5 w-5 text-rose-400" />
                                      : <span className="h-4 w-4 rounded-full border-2 border-neutral-300" />}
                                </span>
                                <span className="flex-1">{choice.choice_text}</span>
                                {isChoiceCorrect && (
                                  <span className="text-[11px] font-bold text-emerald-600">Correct</span>
                                )}
                                {isSelected && !isChoiceCorrect && (
                                  <span className="text-[11px] font-bold text-rose-500">Your answer</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Points */}
                      {answer.points_earned !== undefined && (
                        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          Points earned:{' '}
                          <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                            {answer.points_earned}
                          </span>
                        </div>
                      )}

                      {/* Feedback */}
                      {answer.feedback && (
                        <div className="mt-auto flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                              Teacher Feedback
                            </p>
                            <p className="text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap">
                              {answer.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
