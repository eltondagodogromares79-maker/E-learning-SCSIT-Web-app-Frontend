'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { quizService } from '@/features/quizzes/services/quizService';
import { HelpCircle, Search, Trophy, Clock, Camera, FileText, Settings } from 'lucide-react';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function avatarColor(name: string) {
  const palette = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return palette[name.charCodeAt(0) % palette.length];
}

export default function TeacherQuizSubmissionsPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { data: quiz } = useQuiz(quizId);
  const { data: attempts = [] } = useQuizAttempts(quizId);
  const [query, setQuery] = useState('');
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoStudent, setPhotoStudent] = useState('');
  const [photoItems, setPhotoItems] = useState<Array<{ id: string; image_url: string; reason?: string | null; created_at: string }>>([]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return attempts.filter((attempt) => {
      if (!trimmed) return true;
      return [attempt.student_name, attempt.student_id].filter(Boolean).join(' ').toLowerCase().includes(trimmed);
    });
  }, [attempts, query]);

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
    let submitted = 0, inProgress = 0, feedbackRequired = 0;
    attempts.forEach((attempt) => {
      if (attempt.submitted_at) submitted += 1; else inProgress += 1;
      const needsFeedback = attempt.answers?.some(
        (a) => (a.question_type === 'essay' || a.question_type === 'identification') && Boolean(a.text_answer) && !a.feedback
      );
      if (needsFeedback) feedbackRequired += 1;
    });
    return { submitted, inProgress, feedbackRequired };
  }, [attempts]);

  const topRankings = useMemo(
    () => [...attempts].filter((a) => typeof a.score === 'number').sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5),
    [attempts]
  );

  const statCards = [
    { label: 'Submitted', value: summary.submitted, icon: '✅', color: 'text-emerald-700', bg: 'from-emerald-50 to-white border-emerald-100' },
    { label: 'In Progress', value: summary.inProgress, icon: '⏳', color: 'text-amber-700', bg: 'from-amber-50 to-white border-amber-100' },
    { label: 'Needs Feedback', value: summary.feedbackRequired, icon: '💬', color: 'text-rose-700', bg: 'from-rose-50 to-white border-rose-100' },
    { label: 'Total Points', value: quiz?.total_points ?? 0, icon: '🏆', color: 'text-[var(--brand-blue-deep)]', bg: 'from-blue-50 to-white border-blue-100' },
  ];

  return (
    <AppShell title="Teacher Dashboard" subtitle="Quiz submissions" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">

        {/* hero */}
        <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-white/70" />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Quiz Submissions</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{quiz?.title ?? 'Quiz'}</h1>
              <p className="mt-1 text-sm text-white/70">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''} recorded</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as={Link} href="/dashboard/teacher/quizzes" variant="outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', background: 'rgba(255,255,255,0.15)' }}>← Back to quizzes</Button>
              <Button variant="outline" as={Link} href={`/dashboard/teacher/quizzes/${quizId}`}>
                  <Settings className="mr-1.5 h-4 w-4" /> Manage quiz
                </Button>
            </div>
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${card.bg} p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{card.label}</span>
                <span className="text-base">{card.icon}</span>
              </div>
              <div className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
          {/* attempts list */}
          <div className="space-y-4">
            {/* search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search student…"
                className="pl-9 h-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
                No submissions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((attempt) => {
                  const name = attempt.student_name ?? attempt.student_id ?? 'Student';
                  const scorePct = quiz?.total_points && typeof attempt.score === 'number'
                    ? Math.round((attempt.score / quiz.total_points) * 100) : null;
                  return (
                    <Card key={attempt.id} className="overflow-hidden border border-neutral-200/80 shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="p-0">
                        {/* top row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(name)}`}>
                              {initials(name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">{name}</div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${attempt.submitted_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {attempt.submitted_at ? 'Submitted' : 'In progress'}
                                </span>
                                {attempt.submitted_at && (
                                  <span className="text-[11px] text-neutral-400">
                                    {new Date(attempt.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* score */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-widest text-neutral-400">Score</div>
                              <div className={`text-lg font-bold ${scorePct != null && scorePct >= 75 ? 'text-emerald-700' : scorePct != null && scorePct >= 50 ? 'text-amber-700' : 'text-[var(--brand-blue-deep)]'}`}>
                                {attempt.score ?? 0}
                                <span className="text-xs font-normal text-neutral-400">/{quiz?.total_points ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* bottom row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDuration(attempt.started_at, attempt.submitted_at)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                              onClick={async () => {
                                setPhotoOpen(true);
                                setPhotoLoading(true);
                                setPhotoStudent(name);
                                try {
                                  const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
                                  setPhotoItems(logs.flatMap((log) => log.snapshots ?? []));
                                } catch {
                                  setPhotoItems([]);
                                } finally {
                                  setPhotoLoading(false);
                                }
                              }}>
                              <Camera className="h-3.5 w-3.5" /> Photos
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs" as={Link} href={`/dashboard/teacher/quizzes/${quizId}/proctor-logs?student=${encodeURIComponent(name)}`}>
                                <FileText className="h-3.5 w-3.5" /> Logs
                              </Button>
                            <Button size="sm" className="gap-1.5 text-xs" as={Link} href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}>
                                Review answers
                              </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* sidebar — top scores */}
          <div>
            <Card className="border border-neutral-200/80 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-neutral-700">Top Scores</span>
                </div>
                {topRankings.length === 0 ? (
                  <p className="text-xs text-neutral-400">No graded attempts yet.</p>
                ) : (
                  topRankings.map((attempt, i) => {
                    const n = attempt.student_name ?? 'Student';
                    return (
                      <div key={attempt.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-400' : 'text-neutral-300'}`}>
                            #{i + 1}
                          </span>
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${avatarColor(n)}`}>
                            {initials(n)}
                          </div>
                          <span className="text-sm font-medium text-neutral-800">{n}</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--brand-blue-deep)]">{attempt.score}</span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* snapshots dialog */}
      <Dialog open={photoOpen} onOpenChange={(open) => !open && setPhotoOpen(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Snapshots{photoStudent ? ` · ${photoStudent}` : ''}
              </span>
            </DialogTitle>
          </DialogHeader>
          {photoLoading ? (
            <div className="py-8 text-center text-sm text-neutral-400">Loading photos…</div>
          ) : photoItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-400">No photos captured.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {photoItems.map((snapshot) => (
                <a key={snapshot.id} href={snapshot.image_url} target="_blank" rel="noreferrer"
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md">
                  <img src={snapshot.image_url} alt={snapshot.reason ?? 'snapshot'} className="h-40 w-full object-cover" />
                  <div className="p-2.5">
                    <div className="text-xs font-medium text-neutral-700">{snapshot.reason ?? 'Snapshot'}</div>
                    <div className="text-[11px] text-neutral-400">{new Date(snapshot.created_at).toLocaleString()}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPhotoOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
