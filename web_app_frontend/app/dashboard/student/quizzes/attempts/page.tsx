'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import Link from 'next/link';

function StudentQuizAttemptsPageInner() {
  const searchParams = useSearchParams();
  const filterQuizId = searchParams.get('quizId') ?? '';
  const { data: attempts = [] } = useQuizAttempts();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (filterQuizId && attempt.quiz_id !== filterQuizId) return false;
      if (!trimmed) return true;
      const haystack = [attempt.quiz_title, attempt.quiz_id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [attempts, query, filterQuizId]);

  return (
    <AppShell title="Student Dashboard" subtitle="Quiz Attempts" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Quiz attempts" description="See your submitted quizzes in one place." />
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
                      <Badge variant="outline">{attempt.submitted_at ? 'Submitted' : 'In progress'}</Badge>
                      <Link
                        href={`/dashboard/student/quizzes/${attempt.quiz_id}`}
                        className="rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        Open quiz
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

export default function StudentQuizAttemptsPage() {
  return (
    <Suspense>
      <StudentQuizAttemptsPageInner />
    </Suspense>
  );
}
