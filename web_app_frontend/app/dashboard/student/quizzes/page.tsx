'use client';

import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { StudentCardGridSkeleton, StudentRowsSkeleton } from '@/components/layout/StudentListSkeletons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentNav } from '@/components/navigation/nav-config';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { quizService } from '@/features/quizzes/services/quizService';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import type { QuizProctorLog } from '@/types';
import {
  HelpCircle, Clock, Search, ChevronRight, CheckCircle,
  AlertCircle, Camera, ShieldAlert, BookOpen,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'submitted' | 'overdue';
type SortOrder = 'newest' | 'oldest';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'overdue',   label: 'Overdue' },
];

export default function StudentQuizzesPage() {
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: attempts = [], isLoading: attemptsLoading } = useQuizAttempts();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [activeSnapshots, setActiveSnapshots] = useState<Array<{ id: string; image_url: string; reason?: string | null; created_at?: string }>>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [violationsOpen, setViolationsOpen] = useState(false);
  const [violationLoading, setViolationLoading] = useState(false);
  const [violations, setViolations] = useState<Array<{ id: string; detail?: string; created_at?: string }>>([]);
  const [violationCounts, setViolationCounts] = useState<Record<string, number>>({});
  const pageLoading = quizzesLoading || attemptsLoading || subjectsLoading;
  const now = Date.now();
  const dueSoonMs = 1000 * 60 * 60 * 24 * 3;

  const subjectLookup = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const [sectionFilter, setSectionFilter] = useState('');

  const sections = useMemo(() => {
    const names = new Set(quizzes.map((q) => q.subject_name ?? subjectLookup[q.subject_id] ?? '').filter(Boolean));
    return Array.from(names).sort();
  }, [quizzes, subjectLookup]);

  const submittedByQuizId = useMemo(() =>
    attempts.reduce<Record<string, boolean>>((acc, a) => {
      if (a.submitted_at) acc[String(a.quiz_id)] = true;
      return acc;
    }, {}), [attempts]);

  const attemptsByQuizId = useMemo(() =>
    attempts.reduce<Record<string, typeof attempts>>((acc, a) => {
      const key = String(a.quiz_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {}), [attempts]);

  // Fetch violation counts for all submitted quizzes
  useEffect(() => {
    const submittedQuizIds = Object.keys(submittedByQuizId);
    if (submittedQuizIds.length === 0) return;
    submittedQuizIds.forEach(async (quizId) => {
      if (violationCounts[quizId] !== undefined) return;
      const list = attemptsByQuizId[quizId] ?? [];
      const latest = [...list].sort((a, b) =>
        new Date(b.submitted_at ?? b.started_at ?? 0).getTime() - new Date(a.submitted_at ?? a.started_at ?? 0).getTime()
      )[0];
      if (!latest) return;
      try {
        const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: latest.id });
        const events = (logs ?? []).flatMap((log: QuizProctorLog) => log.events ?? []);
        const count = events.filter((event) => event.type === 'violation').length;
        setViolationCounts((prev) => ({ ...prev, [quizId]: count }));
      } catch {
        setViolationCounts((prev) => ({ ...prev, [quizId]: 0 }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...quizzes]
      .filter((quiz) => {
        const due = quiz.due_date ? new Date(quiz.due_date) : null;
        const dueTime = due?.getTime() ?? null;
        const isSubmitted = submittedByQuizId[String(quiz.id)];
        const isOverdue = Boolean(dueTime !== null && dueTime < now && !isSubmitted);
        if (statusFilter === 'submitted' && !isSubmitted) return false;
        if (statusFilter === 'overdue' && !isOverdue) return false;
        if (statusFilter === 'pending' && (isSubmitted || isOverdue)) return false;
        const subjectName = quiz.subject_name ?? subjectLookup[quiz.subject_id] ?? '';
        if (sectionFilter && subjectName !== sectionFilter) return false;
        if (!q) return true;
        return [quiz.title, subjectName].join(' ').toLowerCase().includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [now, quizzes, query, sortOrder, statusFilter, submittedByQuizId, subjectLookup, sectionFilter]);

  const counts = useMemo(() => {
    let pending = 0, submitted = 0, overdue = 0;
    quizzes.forEach((quiz) => {
      const due = quiz.due_date ? new Date(quiz.due_date) : null;
      const dueTime = due?.getTime() ?? null;
      const isSubmitted = submittedByQuizId[String(quiz.id)];
      if (isSubmitted) submitted++;
      else if (dueTime !== null && dueTime < now) overdue++;
      else pending++;
    });
    return { pending, submitted, overdue };
  }, [now, quizzes, submittedByQuizId]);

  const openSnapshots = async (quizId: string) => {
    const list = attemptsByQuizId[quizId] ?? [];
    const latest = [...list].sort((a, b) =>
      new Date(b.submitted_at ?? b.started_at ?? 0).getTime() - new Date(a.submitted_at ?? a.started_at ?? 0).getTime()
    )[0];
    if (!latest) return;
    setSnapshotLoading(true);
    try {
      const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: latest.id });
      setActiveSnapshots((logs ?? []).flatMap((log: QuizProctorLog) => log.snapshots ?? []));
    } catch { setActiveSnapshots([]); }
    finally { setSnapshotLoading(false); setSnapshotOpen(true); }
  };

  const openViolations = async (quizId: string) => {
    const list = attemptsByQuizId[quizId] ?? [];
    const latest = [...list].sort((a, b) =>
      new Date(b.submitted_at ?? b.started_at ?? 0).getTime() - new Date(a.submitted_at ?? a.started_at ?? 0).getTime()
    )[0];
    if (!latest) return;
    setViolationLoading(true);
    try {
      const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: latest.id });
      const events = (logs ?? []).flatMap((log: QuizProctorLog) => log.events ?? []);
      setViolations(events
        .filter((event) => event.type === 'violation')
        .map((event) => ({ id: event.id, detail: event.detail ?? undefined, created_at: event.created_at })));
    } catch { setViolations([]); }
    finally { setViolationLoading(false); setViolationsOpen(true); }
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Quizzes" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Quizzes</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Quizzes</h1>
              <p className="mt-2 text-sm text-white/70">{quizzes.length} total quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Pending',   value: counts.pending,   icon: <Clock className="h-4 w-4" /> },
                { label: 'Submitted', value: counts.submitted, icon: <CheckCircle className="h-4 w-4" /> },
                { label: 'Overdue',   value: counts.overdue,   icon: <AlertCircle className="h-4 w-4" /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-white/60">{s.icon}</span>
                  <div>
                    <div className="text-lg font-bold leading-none text-white">{s.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Search + filters ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quizzes…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                style={statusFilter === f.value
                  ? { background: 'var(--brand-blue)', color: '#fff', borderColor: 'var(--brand-blue)' }
                  : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {f.label}
              </button>
            ))}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="newest">Newest uploaded</option>
              <option value="oldest">Oldest uploaded</option>
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="">All Subjects</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Cards ── */}
        {pageLoading ? (
          <StudentCardGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <HelpCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No quizzes found.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((quiz) => {
              const due = quiz.due_date ? new Date(quiz.due_date) : null;
              const dueTime = due?.getTime() ?? null;
              const isSubmitted = submittedByQuizId[String(quiz.id)];
              const isOverdue = Boolean(dueTime !== null && dueTime < now && !isSubmitted);
              const isDueSoon = Boolean(dueTime !== null && dueTime >= now && dueTime <= now + dueSoonMs && !isSubmitted);
              const isUnavailable = quiz.is_available === false;
              const subjectName = quiz.subject_name ?? subjectLookup[quiz.subject_id] ?? 'General';

              const statusColor = isSubmitted ? '#059669' : isOverdue ? '#dc2626' : isUnavailable ? '#6b7280' : isDueSoon ? '#d97706' : '#0891b2';
              const statusLabel = isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : isUnavailable ? 'Unavailable' : isDueSoon ? 'Due Soon' : 'Pending';
              const violationCount = violationCounts[String(quiz.id)] ?? 0;

              return (
                <motion.div key={quiz.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    {/* Status bar */}
                    <div className="h-1.5 w-full" style={{ background: statusColor }} />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Subject + status */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                          {subjectName}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: `${statusColor}18`, color: statusColor }}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Title + violation badge */}
                      <div className="mb-4 flex flex-1 items-start justify-between gap-2">
                        <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                          {quiz.title}
                        </h3>
                        {isSubmitted && violationCount > 0 && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            <ShieldAlert className="h-3 w-3" />
                            {violationCount} violation{violationCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="mb-5 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Clock className="h-3.5 w-3.5" />
                          {quiz.time_limit_minutes ?? 20} mins
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <BookOpen className="h-3.5 w-3.5" />
                          Due {due ? due.toLocaleDateString() : 'TBA'}
                        </div>
                      </div>

                      {/* Actions */}
                      {isUnavailable ? (
                        <div className="rounded-xl border px-4 py-2.5 text-center text-xs font-semibold"
                          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                          Not available yet
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex flex-col gap-2">
                          <Link href={`/dashboard/student/quizzes/${quiz.id}/answers`}
                            className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                            style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)', background: 'var(--brand-blue-muted)' }}>
                            View Submission
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => openSnapshots(String(quiz.id))}
                              className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--surface-2)' }}>
                              <Camera className="h-3.5 w-3.5" />
                              Snapshots
                            </button>
                            <button onClick={() => openViolations(String(quiz.id))}
                              className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--surface-2)' }}>
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Violations
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Link href={`/dashboard/student/quizzes/${quiz.id}`}
                          className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: 'var(--brand-blue)' }}>
                          Start Quiz
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Snapshots dialog ── */}
        <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                <span className="flex items-center gap-2">
                  <Camera className="h-5 w-5" style={{ color: 'var(--brand-blue)' }} />
                  Proctoring Snapshots
                </span>
              </DialogTitle>
              <DialogDescription>Photos captured automatically during your quiz session.</DialogDescription>
            </DialogHeader>
            {snapshotLoading ? (
              <StudentRowsSkeleton count={4} />
            ) : activeSnapshots.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border p-10 text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <Camera className="h-8 w-8 opacity-30" />
                <p className="text-sm">No snapshots available.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeSnapshots.map((shot) => (
                  <div key={shot.id} className="overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)' }}>
                    <img src={shot.image_url} alt={shot.reason ?? 'Snapshot'} className="h-48 w-full object-cover" />
                    <div className="px-4 py-3" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{shot.reason ?? 'Snapshot'}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {shot.created_at ? new Date(shot.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Violations dialog ── */}
        <Dialog open={violationsOpen} onOpenChange={setViolationsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Violation Logs
                </span>
              </DialogTitle>
              <DialogDescription>Proctoring events recorded during your quiz.</DialogDescription>
            </DialogHeader>
            {violationLoading ? (
              <StudentRowsSkeleton count={4} />
            ) : violations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border p-10 text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <ShieldAlert className="h-8 w-8 opacity-30" />
                <p className="text-sm">No violations recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v, i) => (
                  <div key={v.id} className="flex gap-3 overflow-hidden rounded-2xl border"
                    style={{ borderColor: '#fda4af', background: '#fff1f2' }}>
                    <div className="flex w-10 shrink-0 items-center justify-center"
                      style={{ background: '#fda4af' }}>
                      <span className="text-xs font-bold text-rose-700">{i + 1}</span>
                    </div>
                    <div className="py-3 pr-4">
                      <p className="text-sm font-semibold text-rose-900">{v.detail ?? 'Rule violation'}</p>
                      <p className="mt-0.5 text-xs text-rose-600">
                        {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
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
