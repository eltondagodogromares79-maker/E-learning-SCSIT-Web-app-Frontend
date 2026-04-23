'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorSummary } from '@/types';
import { ShieldCheck, AlertTriangle, XCircle, Camera, Search } from 'lucide-react';

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
      .then((data) => { if (mounted) setSummary(data ?? []); })
      .catch(() => { if (mounted) setSummary([]); });
    return () => { mounted = false; };
  }, []);

  const summaryByQuiz = useMemo(() => {
    return summary.reduce<Record<string, QuizProctorSummary>>((acc, item) => {
      acc[item.quiz_id] = item;
      return acc;
    }, {});
  }, [summary]);

  const totalSessions = summary.reduce((s, i) => s + (i.total_sessions ?? 0), 0);
  const totalWarnings = summary.reduce((s, i) => s + (i.total_warnings ?? 0), 0);
  const totalTerminations = summary.reduce((s, i) => s + (i.total_terminations ?? 0), 0);
  const totalSnapshots = summary.reduce((s, i) => s + (i.total_snapshots ?? 0), 0);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Proctoring" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Proctoring</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Proctoring Dashboard</h1>
            <p className="mt-2 text-sm text-white/70">
              {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} · Review violations and student activity
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Sessions', value: totalSessions, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Warnings', value: totalWarnings, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Terminations', value: totalTerminations, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Snapshots', value: totalSnapshots, icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-5 shadow-sm">
              <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{value}</div>
              <div className="mt-0.5 text-xs uppercase tracking-[0.2em] text-neutral-400">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Quiz list ── */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Quizzes</CardTitle>
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search quizzes…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                No quizzes found.
              </div>
            ) : (
              filtered.map((quiz) => {
                const s = summaryByQuiz[quiz.id];
                return (
                  <div
                    key={quiz.id}
                    className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.3)] hover:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">{quiz.subject_name ?? 'General'}</div>
                      </div>
                      <Badge variant="outline">{quiz.attempt_limit} attempt{quiz.attempt_limit !== 1 ? 's' : ''}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <ShieldCheck className="h-3 w-3" />
                        {s?.total_sessions ?? 0} sessions
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {s?.total_warnings ?? 0} warnings
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <XCircle className="h-3 w-3" />
                        {s?.total_terminations ?? 0} terminations
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                        <Camera className="h-3 w-3" />
                        {s?.total_snapshots ?? 0} snapshots
                      </span>
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/dashboard/teacher/quizzes/${quiz.id}/proctor-logs`}
                        className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        View logs →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
