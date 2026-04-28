'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { StudentCardGridSkeleton, StudentRowsSkeleton } from '@/components/layout/StudentListSkeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useFavoriteLessons } from '@/features/lessons/hooks/useFavoriteLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useMemo, useState } from 'react';
import { Search, User, ChevronRight, GraduationCap, BookOpen, ClipboardList, HelpCircle, Clock, CalendarDays, Heart } from 'lucide-react';

const ACCENT_COLORS = [
  { bg: '#0D1282', light: 'rgba(13,18,130,0.08)' },
  { bg: '#7c3aed', light: 'rgba(124,58,237,0.08)' },
  { bg: '#0891b2', light: 'rgba(8,145,178,0.08)' },
  { bg: '#059669', light: 'rgba(5,150,105,0.08)' },
  { bg: '#d97706', light: 'rgba(217,119,6,0.08)' },
  { bg: '#dc2626', light: 'rgba(220,38,38,0.08)' },
];

export default function StudentDashboardPage() {
  const { data: subjects = [], isLoading: subjectsLoading } = useSectionSubjects();
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();
  const { data: favorites = [], isLoading: favoritesLoading } = useFavoriteLessons();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: submissions = [], isLoading: submissionsLoading } = useAssignmentSubmissions();
  const { data: quizAttempts = [], isLoading: quizAttemptsLoading } = useQuizAttempts();
  const [query, setQuery] = useState('');
  const dashboardLoading =
    subjectsLoading ||
    lessonsLoading ||
    favoritesLoading ||
    assignmentsLoading ||
    quizzesLoading ||
    submissionsLoading ||
    quizAttemptsLoading;

  const submissionLookup = Object.fromEntries(submissions.map((s) => [s.assignment_id, s]));
  const attemptLookup = Object.fromEntries(quizAttempts.filter((a) => a.submitted_at).map((a) => [a.quiz_id, a]));

  const filteredSubjects = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const list = trimmed
      ? subjects.filter((s) =>
          [s.subject_name, s.section_name, s.teacher_name].filter(Boolean).join(' ').toLowerCase().includes(trimmed)
        )
      : [...subjects];

    return list.sort((a, b) => {
      const parseTime = (t?: string) => {
        if (!t) return Infinity;
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return Infinity;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a.schedule_time) - parseTime(b.schedule_time);
    });
  }, [query, subjects]);

  const previewLessons = lessons.slice(0, 4);
  const pendingAssignments = assignments.filter((a) => !submissionLookup[a.id]).slice(0, 4);
  const pendingQuizzes = quizzes.filter((q) => !attemptLookup[q.id]).slice(0, 4);

  return (
    <AppShell title="Student Dashboard" subtitle="Home" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10 bg-white" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full opacity-5 bg-white" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">My Subjects</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Enrolled Subjects</h1>
              <p className="mt-2 text-sm text-white/70">
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} enrolled this year
              </p>
            </div>
          </div>
        </div>

        {/* ── Search + filter for subjects ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, teacher…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Subject Cards ── */}
        {dashboardLoading ? (
          <StudentCardGridSkeleton count={6} columnsClass="md:grid-cols-2 xl:grid-cols-3" />
        ) : filteredSubjects.length === 0 ? (
          <div className="rounded-2xl border p-16 text-center text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            {query.trim() ? `No subjects found for "${query.trim()}".` : 'No subjects enrolled yet.'}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredSubjects.map((subject, i) => {
              const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <motion.div key={subject.id} whileHover={{ y: -4, boxShadow: '0 20px 50px -20px rgba(0,0,0,0.18)' }} transition={{ duration: 0.18 }} className="h-full">
                  <Link href={`/dashboard/student/subjects/${subject.subject_id}`} className="flex h-full flex-col overflow-hidden rounded-2xl border-2"
                    style={{ borderColor: accent.bg, background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="h-1.5 w-full" style={{ background: accent.bg }} />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                          style={{ background: accent.light, color: accent.bg }}>
                          {subject.section_name ?? 'N/A'}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                          {subject.term_label ?? '—'}
                        </span>
                      </div>
                      <h2 className="mb-1 text-lg font-bold leading-snug" style={{ color: 'var(--foreground)' }}>{subject.subject_name}</h2>
                      <div className="mb-4 flex-1 space-y-1.5">
                        {subject.schedule_days ? (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: accent.bg }} />
                            {subject.schedule_days}
                          </div>
                        ) : null}
                        {subject.schedule_time ? (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: accent.bg }} />
                            {subject.schedule_time}
                          </div>
                        ) : null}
                        {!subject.schedule_days && !subject.schedule_time ? (
                          <div className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>No schedule set</div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: accent.light }}>
                            <User className="h-3.5 w-3.5" style={{ color: accent.bg }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            {subject.teacher_name ?? 'TBA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent.bg }}>
                          Open <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Divider ── */}
        <div className="relative flex items-center gap-4">
          <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: 'var(--border)' }} />
          <span className="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            Overview
          </span>
          <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: 'var(--border)' }} />
        </div>

        {/* ── Bottom 3 cards ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Learning Materials */}
          <Card className="border-2" style={{ borderColor: '#0891b2' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: '#0891b2' }} />
                Learning Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardLoading ? (
                <StudentRowsSkeleton count={4} />
              ) : favorites.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>
                    <Heart className="h-3 w-3" style={{ fill: '#dc2626', color: '#dc2626' }} />
                    Favorites
                  </div>
                  {favorites.slice(0, 3).map((lesson) => (
                    <Link key={lesson.id} href={`/dashboard/student/lessons/${lesson.id}`}
                      className="flex items-center justify-between rounded-xl p-3 transition hover:bg-[var(--surface-2)]"
                      style={{ border: '1px solid #fca5a5', background: 'rgba(220,38,38,0.03)' }}>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{lesson.title}</div>
                        <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{lesson.content_type}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 ml-2" style={{ color: 'var(--muted-foreground)' }} />
                    </Link>
                  ))}
                  <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }} />
                  <div className="pb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Recent</div>
                </>
              )}
              {!dashboardLoading && previewLessons.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No materials yet.</div>
              ) : !dashboardLoading && previewLessons.map((lesson) => (
                <Link key={lesson.id} href={`/dashboard/student/lessons/${lesson.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition hover:bg-[var(--surface-2)]"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{lesson.title}</div>
                    <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{lesson.content_type}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 ml-2" style={{ color: 'var(--muted-foreground)' }} />
                </Link>
              ))}
              <Link href="/dashboard/student/lessons" className="flex items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition hover:bg-[var(--surface-2)]"
                style={{ borderColor: 'var(--border)', color: '#0891b2' }}>
                View all materials <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Assignments Due */}
          <Card className="border-2" style={{ borderColor: '#d97706' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" style={{ color: '#d97706' }} />
                Assignments Due
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardLoading ? (
                <StudentRowsSkeleton count={4} />
              ) : pendingAssignments.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No pending assignments.</div>
              ) : pendingAssignments.map((assignment) => (
                <Link key={assignment.id} href={`/dashboard/student/assignments/${assignment.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition hover:bg-[var(--surface-2)]"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{assignment.title}</div>
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-3 w-3" />
                      {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'TBA'}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 ml-2" style={{ color: 'var(--muted-foreground)' }} />
                </Link>
              ))}
              <Link href="/dashboard/student/assignments" className="flex items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition hover:bg-[var(--surface-2)]"
                style={{ borderColor: 'var(--border)', color: '#d97706' }}>
                View all assignments <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Quizzes */}
          <Card className="border-2" style={{ borderColor: '#7c3aed' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" style={{ color: '#7c3aed' }} />
                Upcoming Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardLoading ? (
                <StudentRowsSkeleton count={4} />
              ) : pendingQuizzes.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No upcoming quizzes.</div>
              ) : pendingQuizzes.map((quiz) => (
                <Link key={quiz.id} href={`/dashboard/student/quizzes/${quiz.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition hover:bg-[var(--surface-2)]"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{quiz.title}</div>
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-3 w-3" />
                      {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : 'TBA'}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 ml-2" style={{ color: 'var(--muted-foreground)' }} />
                </Link>
              ))}
              <Link href="/dashboard/student/quizzes" className="flex items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition hover:bg-[var(--surface-2)]"
                style={{ borderColor: 'var(--border)', color: '#7c3aed' }}>
                View all quizzes <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
