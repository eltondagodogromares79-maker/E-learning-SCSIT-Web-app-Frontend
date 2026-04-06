'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorSummary } from '@/types';

export default function TeacherProctoringPage() {
  const { data: quizzes = [] } = useQuizzes();
  const [query, setQuery] = useState('');
  const [summary, setSummary] = useState<QuizProctorSummary[]>([]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return quizzes;
    return quizzes.filter((quiz) => {
      const haystack = [quiz.title, quiz.subject_name].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [query, quizzes]);

  useEffect(() => {
    let mounted = true;
    quizService
      .getProctorSummary()
      .then((data) => {
        if (mounted) setSummary(data ?? []);
      })
      .catch(() => {
        if (mounted) setSummary([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const summaryByQuiz = useMemo(() => {
    return summary.reduce<Record<string, QuizProctorSummary>>((acc, item) => {
      acc[item.quiz_id] = item;
      return acc;
    }, {});
  }, [summary]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Proctoring" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader title="Proctoring dashboard" description="Review quiz proctor logs and student violations." />
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quizzes</CardTitle>
            <Input
              placeholder="Search quizzes"
              className="md:w-72"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No quizzes found.
              </div>
            ) : (
              filtered.map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="outline">{summaryByQuiz[quiz.id]?.total_sessions ?? 0} sessions</Badge>
                    <Badge variant="outline">{summaryByQuiz[quiz.id]?.total_warnings ?? 0} warnings</Badge>
                    <Badge variant="outline">{summaryByQuiz[quiz.id]?.total_terminations ?? 0} terminations</Badge>
                    <Badge variant="outline">{summaryByQuiz[quiz.id]?.total_snapshots ?? 0} snapshots</Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                      <div className="text-xs text-neutral-500">{quiz.subject_name ?? 'General'}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{quiz.attempt_limit} attempts</Badge>
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz.id}/proctor-logs`}
                        className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        View logs
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
