'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentNav } from '@/components/navigation/nav-config';
import { useSubjectContent } from '@/features/subjects/hooks/useSubjectContent';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useSubmitAssignment } from '@/features/assignments/hooks/useSubmitAssignment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { useFavoriteLessons } from '@/features/lessons/hooks/useFavoriteLessons';
import { useToggleFavorite } from '@/features/lessons/hooks/useToggleFavorite';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import {
  BookOpen, ClipboardList, HelpCircle, User, ArrowLeft,
  Clock, ExternalLink, FileText, CheckCircle, AlertCircle, ChevronRight, Video, Wifi, Search,
  GraduationCap, CalendarCheck, Target, TrendingUp, X, Download, Link2, AlignLeft, Calendar,
  Star, MessageSquare, Paperclip, Heart,
} from 'lucide-react';

const TABS = ['Learning Materials', 'Assignments', 'Quizzes', 'Attendance', 'Progress'] as const;
type Tab = typeof TABS[number];
type SortOrder = 'newest' | 'oldest';

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function StudentSubjectDetailPage() {
  const params = useParams();
  const subjectId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data, isLoading } = useSubjectContent(subjectId);
  const { data: submissions = [] } = useAssignmentSubmissions();
  const { data: quizAttempts = [] } = useQuizAttempts();
  const [activeTab, setActiveTab] = useState<Tab>('Learning Materials');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { data: favorites = [] } = useFavoriteLessons();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm('');
    setSortOrder('newest');
  }, [activeTab]);

  // derive section_subject_id from any lesson/assignment/quiz in the content
  const sectionSubjectId = useMemo(() => {
    return (
      data?.lessons[0]?.section_subject_id ??
      data?.assignments[0]?.section_subject_id ??
      data?.quizzes[0]?.section_subject_id ??
      undefined
    );
  }, [data]);

  const { data: allSessions = [], refetch: refetchSessions } = useAttendanceSessions({
    section_subject: sectionSubjectId ?? '',
  });

  const submissionLookup = Object.fromEntries(
    submissions.map((s) => [s.assignment_id, s])
  );

  const quizAttemptLookup = useMemo(() => {
    const entries = quizAttempts
      .filter((attempt) => data?.quizzes.some((quiz) => String(quiz.id) === String(attempt.quiz_id)))
      .filter((attempt) => attempt.submitted_at)
      .sort((a, b) =>
        new Date(b.submitted_at ?? b.started_at ?? 0).getTime() -
        new Date(a.submitted_at ?? a.started_at ?? 0).getTime()
      );
    return Object.fromEntries(entries.map((attempt) => [attempt.quiz_id, attempt]));
  }, [data?.quizzes, quizAttempts]);

  const now = Date.now();
  const dueSoonMs = 1000 * 60 * 60 * 24 * 3;

  const progressStats = useMemo(() => {
    const assignments = data?.assignments ?? [];
    const quizzes = data?.quizzes ?? [];
    const sessions = allSessions ?? [];

    const submittedAssignments = assignments.filter((assignment) => submissionLookup[assignment.id]);
    const pendingAssignments = assignments.filter((assignment) => !submissionLookup[assignment.id]);
    const overdueAssignments = pendingAssignments.filter((assignment) => new Date(assignment.due_date).getTime() < now);
    const dueSoonAssignments = pendingAssignments.filter((assignment) => {
      const due = new Date(assignment.due_date).getTime();
      return due >= now && due <= now + dueSoonMs;
    });

    const attemptedQuizzes = quizzes.filter((quiz) => quizAttemptLookup[quiz.id]);
    const pendingQuizzes = quizzes.filter((quiz) => !quizAttemptLookup[quiz.id]);
    const overdueQuizzes = pendingQuizzes.filter((quiz) => {
      if (!quiz.due_date) return false;
      return new Date(quiz.due_date).getTime() < now;
    });
    const dueSoonQuizzes = pendingQuizzes.filter((quiz) => {
      if (!quiz.due_date) return false;
      const due = new Date(quiz.due_date).getTime();
      return due >= now && due <= now + dueSoonMs;
    });

    const gradedAssignments = submittedAssignments.filter((assignment) => typeof submissionLookup[assignment.id]?.score === 'number');
    const gradedQuizzes = attemptedQuizzes.filter((quiz) => typeof quizAttemptLookup[quiz.id]?.score === 'number');

    const assignmentAverage = gradedAssignments.length
      ? Math.round(
          gradedAssignments.reduce((sum, assignment) => {
            const submission = submissionLookup[assignment.id];
            return sum + (((submission?.score ?? 0) / Math.max(assignment.total_points || 1, 1)) * 100);
          }, 0) / gradedAssignments.length
        )
      : null;

    const quizAverage = gradedQuizzes.length
      ? Math.round(
          gradedQuizzes.reduce((sum, quiz) => {
            const attempt = quizAttemptLookup[quiz.id];
            return sum + (((attempt?.score ?? 0) / Math.max(quiz.total_points || 1, 1)) * 100);
          }, 0) / gradedQuizzes.length
        )
      : null;

    const attendanceMarked = sessions.filter((session) => Boolean(session.my_status));
    const attendancePresent = sessions.filter((session) => session.my_status === 'present' || session.my_status === 'late');
    const attendanceAbsent = sessions.filter((session) => session.my_status === 'absent');
    // Only count sessions that have already occurred as the denominator
    const pastSessions = sessions.filter((session) => new Date(session.scheduled_at).getTime() <= now);

    const pendingItems = pendingAssignments.length + pendingQuizzes.length;
    const overdueItems = overdueAssignments.length + overdueQuizzes.length;
    const dueSoonItems = dueSoonAssignments.length + dueSoonQuizzes.length;
    const totalTrackables = assignments.length + quizzes.length;
    const completedTrackables = submittedAssignments.length + attemptedQuizzes.length;

    const upcoming = [
      ...dueSoonAssignments.map((assignment) => ({
        id: `assignment-${assignment.id}`,
        kind: 'Assignment',
        title: assignment.title,
        due: assignment.due_date,
      })),
      ...dueSoonQuizzes.map((quiz) => ({
        id: `quiz-${quiz.id}`,
        kind: 'Quiz',
        title: quiz.title,
        due: quiz.due_date ?? '',
      })),
    ].sort((left, right) => new Date(left.due).getTime() - new Date(right.due).getTime());

    return {
      pendingItems,
      overdueItems,
      dueSoonItems,
      completionRate: percentage(completedTrackables, totalTrackables),
      assignmentCompletion: percentage(submittedAssignments.length, assignments.length),
      quizCompletion: percentage(attemptedQuizzes.length, quizzes.length),
      assignmentAverage,
      quizAverage,
      attendanceRate: percentage(attendancePresent.length, pastSessions.length),
      attendanceCompletion: percentage(attendanceMarked.length, pastSessions.length),
      attendancePresent: attendancePresent.length,
      attendanceAbsent: attendanceAbsent.length,
      attendanceSessions: pastSessions.length,
      upcoming,
      pendingAssignmentsList: pendingAssignments,
      pendingQuizzesList: pendingQuizzes,
      overdueAssignmentsList: overdueAssignments,
      overdueQuizzesList: overdueQuizzes,
    };
  }, [allSessions, data?.assignments, data?.quizzes, dueSoonMs, now, quizAttemptLookup, submissionLookup]);

  const filteredLessons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...(data?.lessons ?? [])]
      .filter((lesson) => {
        if (!q) return true;
        return [lesson.title, lesson.description ?? '', lesson.subject_name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [data?.lessons, searchTerm, sortOrder]);

  const filteredAssignments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...(data?.assignments ?? [])]
      .filter((assignment) => {
        if (!q) return true;
        return [assignment.title, assignment.description ?? '', assignment.subject_name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [data?.assignments, searchTerm, sortOrder]);

  const filteredQuizzes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...(data?.quizzes ?? [])]
      .filter((quiz) => {
        if (!q) return true;
        return [quiz.title, quiz.description ?? '', quiz.subject_name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [data?.quizzes, searchTerm, sortOrder]);

  const filteredAttendance = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...allSessions]
      .filter((session) => {
        if (!q) return true;
        return [session.title, session.subject_name, session.subject_code, session.section_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at ?? left.scheduled_at).getTime();
        const rightTime = new Date(right.created_at ?? right.scheduled_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [allSessions, searchTerm, sortOrder]);

  const tabCounts = {
    'Learning Materials': data?.lessons.length ?? 0,
    Assignments: data?.assignments.length ?? 0,
    Quizzes: data?.quizzes.length ?? 0,
    Attendance: allSessions.length,
    Progress: progressStats.pendingItems,
  };

  const tabIcons: Record<Tab, React.ReactNode> = {
    'Learning Materials': <BookOpen className="h-4 w-4" />,
    Assignments: <ClipboardList className="h-4 w-4" />,
    Quizzes: <HelpCircle className="h-4 w-4" />,
    Attendance: <CalendarCheck className="h-4 w-4" />,
    Progress: <GraduationCap className="h-4 w-4" />,
  };

  const activeResultsCount =
    activeTab === 'Learning Materials' ? filteredLessons.length :
    activeTab === 'Assignments' ? filteredAssignments.length :
    activeTab === 'Quizzes' ? filteredQuizzes.length :
    activeTab === 'Attendance' ? filteredAttendance.length :
    progressStats.pendingItems;

  return (
    <AppShell title="Student Dashboard" subtitle="Subject" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Back ── */}
        <Button as={Link} href="/dashboard/student" variant="ghost" size="sm"
          className="gap-2 -ml-1 text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* ── Hero banner ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
          style={{ background: 'var(--brand-blue)' }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10 bg-white" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full opacity-5 bg-white" />
          <div className="relative">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/60">
              {data?.subject.code ?? 'Subject'}
            </p>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">
              {isLoading ? 'Loading…' : (data?.subject.name ?? 'Subject Details')}
            </h1>
            {data?.subject.description && (
              <p className="mt-2 max-w-2xl text-sm text-white/70">{data.subject.description}</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
                <User className="h-4 w-4 text-white/60" />
                {data?.subject.instructor_name ?? 'TBA'}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
                <BookOpen className="h-4 w-4 text-white/60" />
                {data?.subject.units ?? '—'} units
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border p-16 text-center text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            Loading subject content…
          </div>
        ) : (
          <>
            {/* ── Tabs ── */}
            <div className="flex gap-1 rounded-2xl border p-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={
                    activeTab === tab
                      ? { background: 'var(--brand-blue)', color: '#fff', boxShadow: '0 4px 14px -4px rgba(13,18,130,0.4)' }
                      : { color: 'var(--muted-foreground)', background: 'transparent' }
                  }
                >
                  {tabIcons[tab]}
                  {tab}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={
                      activeTab === tab
                        ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                        : { background: 'var(--surface-2)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            {activeTab !== 'Progress' && (
              <div className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={`Search ${activeTab.toLowerCase()}…`}
                      className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)' }}
                    >
                      <option value="newest">Newest uploaded</option>
                      <option value="oldest">Oldest uploaded</option>
                    </select>
                    <span className="text-sm"
                      style={{ color: 'var(--muted-foreground)' }}>
                      {activeResultsCount} result{activeResultsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Learning Materials tab ── */}
            {activeTab === 'Learning Materials' && (
              selectedLessonId ? (
                <LessonDetail lessonId={selectedLessonId} onBack={() => setSelectedLessonId(null)} />
              ) : (
                <div className="space-y-4">
                  {/* Favorites toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFavoritesOnly(false)}
                      className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                      style={!showFavoritesOnly
                        ? { background: 'var(--brand-blue)', color: '#fff', borderColor: 'var(--brand-blue)' }
                        : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setShowFavoritesOnly(true)}
                      className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                      style={showFavoritesOnly
                        ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' }
                        : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                    >
                      <Heart className="h-3.5 w-3.5" style={{ fill: showFavoritesOnly ? '#fff' : 'none' }} />
                      My Favorites
                    </button>
                    <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {showFavoritesOnly
                        ? `${filteredLessons.filter((l) => favoriteIds.has(l.id)).length} favorite${filteredLessons.filter((l) => favoriteIds.has(l.id)).length !== 1 ? 's' : ''}`
                        : `${filteredLessons.length} material${filteredLessons.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {/* Cards */}
                  {(() => {
                    const displayed = showFavoritesOnly ? filteredLessons.filter((l) => favoriteIds.has(l.id)) : filteredLessons;
                    if (!displayed.length) return (
                      <EmptyState
                        icon={<BookOpen className="h-8 w-8" />}
                        message={showFavoritesOnly ? 'No favorites in this subject yet.' : 'No learning materials yet.'}
                      />
                    );
                    return (
                      <div className="grid gap-4 md:grid-cols-2">
                        {displayed.map((lesson) => (
                          <div key={lesson.id} className="overflow-hidden rounded-2xl border"
                            style={{ borderColor: favoriteIds.has(lesson.id) ? '#fca5a5' : 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                            {lesson.file_url && lesson.content_type === 'image' && (
                              <img src={lesson.file_url} alt={lesson.title} className="h-40 w-full object-cover" />
                            )}
                            <div className="p-5">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <span className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                                    style={{ background: 'var(--surface-2)', color: 'var(--brand-blue)' }}>
                                    {lesson.content_type}
                                  </span>
                                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{lesson.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleFavorite.mutate(lesson.id)}
                                    className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-[var(--surface-2)]"
                                    title={favoriteIds.has(lesson.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart className="h-4 w-4"
                                      style={{ color: favoriteIds.has(lesson.id) ? '#dc2626' : 'var(--muted-foreground)', fill: favoriteIds.has(lesson.id) ? '#dc2626' : 'none' }} />
                                  </button>
                                  <Button onClick={() => setSelectedLessonId(lesson.id)} size="sm" variant="outline">View</Button>
                                </div>
                              </div>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                Added {new Date(lesson.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )
            )}

            {/* ── Assignments tab ── */}
            {activeTab === 'Assignments' && (
              selectedAssignmentId ? (
                <AssignmentDetail
                  assignmentId={selectedAssignmentId}
                  assignments={data?.assignments ?? []}
                  submissions={submissions}
                  onBack={() => setSelectedAssignmentId(null)}
                />
              ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {!filteredAssignments.length ? (
                  <EmptyState icon={<ClipboardList className="h-8 w-8" />} message="No assignments yet." />
                ) : filteredAssignments.map((assignment) => {
                  const submission = submissionLookup[assignment.id];
                  const due = new Date(assignment.due_date);
                  const isOverdue = !submission && !Number.isNaN(due.getTime()) && due < new Date();
                  const isGraded = submission && (submission.graded_at || typeof submission.score === 'number');
                  const isLate = submission?.submitted_at && new Date(submission.submitted_at) > due;

                  let statusLabel = isOverdue ? 'Overdue' : 'Pending';
                  let statusVariant: 'outline' | 'muted' | 'destructive' | 'success' = isOverdue ? 'destructive' : 'outline';
                  if (isGraded) { statusLabel = 'Graded'; statusVariant = 'success'; }
                  else if (isLate) { statusLabel = 'Late'; statusVariant = 'destructive'; }
                  else if (submission) { statusLabel = 'Submitted'; statusVariant = 'muted'; }

                  return (
                    <div key={assignment.id} className="overflow-hidden rounded-2xl border"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                      <div className="h-1 w-full" style={{
                        background: isGraded ? '#059669' : isOverdue || isLate ? '#dc2626' : submission ? '#d97706' : 'var(--border)'
                      }} />
                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                            {assignment.title}
                          </h3>
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <Clock className="h-3.5 w-3.5" />
                            Due {due.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            {assignment.total_points} pts
                          </div>
                        </div>
                        <Button onClick={() => setSelectedAssignmentId(assignment.id)}
                          size="sm" variant="outline" className="w-full justify-between">
                          View assignment
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )
            )}

            {/* ── Quizzes tab ── */}
            {activeTab === 'Quizzes' && (
              <div className="grid gap-4 md:grid-cols-2">
                {!filteredQuizzes.length ? (
                  <EmptyState icon={<HelpCircle className="h-8 w-8" />} message="No quizzes yet." />
                ) : filteredQuizzes.map((quiz) => {
                  const latestAttempt = quizAttemptLookup[quiz.id];
                  const due = quiz.due_date ? new Date(quiz.due_date) : null;
                  const dueTime = due?.getTime() ?? null;
                  const isSubmitted = Boolean(latestAttempt?.submitted_at);
                  const isUnavailable = quiz.is_available === false;
                  const isOverdue = Boolean(dueTime !== null && dueTime < now && !isSubmitted);
                  const isDueSoon = Boolean(dueTime !== null && dueTime >= now && dueTime <= now + dueSoonMs && !isSubmitted);

                  let statusLabel = 'Pending';
                  let statusVariant: 'outline' | 'muted' | 'destructive' | 'success' = 'outline';
                  let statusBar = 'var(--brand-blue)';
                  if (isSubmitted) {
                    statusLabel = 'Submitted';
                    statusVariant = 'success';
                    statusBar = '#059669';
                  } else if (isOverdue) {
                    statusLabel = 'Overdue';
                    statusVariant = 'destructive';
                    statusBar = '#dc2626';
                  } else if (isUnavailable) {
                    statusLabel = 'Unavailable';
                    statusVariant = 'muted';
                    statusBar = '#6b7280';
                  } else if (isDueSoon) {
                    statusLabel = 'Due Soon';
                    statusVariant = 'muted';
                    statusBar = '#d97706';
                  }

                  return (
                    <div key={quiz.id} className="overflow-hidden rounded-2xl border"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                      <div className="h-1 w-full" style={{ background: statusBar }} />
                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                            {quiz.title}
                          </h3>
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <Clock className="h-3.5 w-3.5" />
                            {quiz.time_limit_minutes ?? 20} mins
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <AlertCircle className="h-3.5 w-3.5" />
                            {quiz.attempt_limit} attempt{quiz.attempt_limit !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <BookOpen className="h-3.5 w-3.5" />
                            Due {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : 'TBA'}
                          </div>
                        </div>
                        <div className="mt-4">
                          {isSubmitted ? (
                            <Button as={Link} href={`/dashboard/student/quizzes/${quiz.id}/answers`}
                              size="sm" variant="outline" className="w-full justify-between">
                              View Submission
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          ) : isUnavailable ? (
                            <div className="rounded-xl border px-4 py-2.5 text-center text-xs font-semibold"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                              Not available yet
                            </div>
                          ) : (
                            <Button as={Link} href={`/dashboard/student/quizzes/${quiz.id}`}
                              size="sm" variant="outline" className="w-full justify-between">
                              Start Quiz
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Attendance tab ── */}
            {activeTab === 'Attendance' && (
              <div className="grid gap-4 md:grid-cols-2">
                {!filteredAttendance.length ? (
                  <EmptyState icon={<CalendarCheck className="h-8 w-8" />} message="No attendance records yet for this subject." />
                ) : filteredAttendance.map((session) => {
                  const isLive = session.is_live && !session.ended_at;
                  const isEnded = Boolean(session.ended_at);
                  const statusColor = isLive ? '#059669' : isEnded ? '#6b7280' : '#d97706';
                  const statusLabel = session.is_online_class
                    ? isLive ? 'Live now' : isEnded ? 'Ended' : 'Scheduled'
                    : session.my_status ? `Marked ${session.my_status}` : 'Attendance';
                  const myStatus = session.my_status;

                  return (
                    <div key={session.id} className="overflow-hidden rounded-2xl border"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                      {/* Live indicator bar */}
                      <div className="h-1.5 w-full" style={{ background: statusColor }} />
                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                            {session.title ?? `${session.subject_name ?? 'Attendance'} Session`}
                          </h3>
                          <span className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: `${statusColor}18`, color: statusColor }}>
                            {isLive && <Wifi className="h-3 w-3" />}
                            {statusLabel}
                          </span>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <Clock className="h-3.5 w-3.5" />
                            {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'TBA'}
                          </div>
                          {session.created_by_name && (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              <User className="h-3.5 w-3.5" />
                              {session.created_by_name}
                            </div>
                          )}
                        </div>

                        {/* Attendance status */}
                        {myStatus && (
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Your attendance:</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              myStatus === 'present' ? 'bg-emerald-50 text-emerald-700'
                              : myStatus === 'late' ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                            }`}>
                              {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                            </span>
                          </div>
                        )}

                        {session.is_online_class ? (
                          <button
                            disabled={joiningId === session.id || isEnded || !isLive}
                            onClick={async () => {
                              setJoiningId(session.id);
                              try {
                                const result = await attendanceService.joinSession(session.id);
                                const url = result?.join_url ?? session.join_url;
                                if (url) window.open(url, '_blank');
                              } finally {
                                await refetchSessions();
                                setJoiningId(null);
                              }
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                            style={{ background: isEnded ? '#6b7280' : isLive ? '#059669' : 'var(--brand-blue)' }}
                          >
                            <Video className="h-4 w-4" />
                            {isEnded ? 'Class ended'
                              : !isLive ? 'Waiting for teacher'
                              : joiningId === session.id ? 'Joining…'
                              : 'Join class'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between rounded-xl border px-4 py-3 text-xs"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--muted-foreground)' }}>
                            <span>Attendance status</span>
                            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {myStatus ? myStatus.charAt(0).toUpperCase() + myStatus.slice(1) : 'Not marked yet'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Progress tab ── */}
            {activeTab === 'Progress' && (
              <div className="space-y-6">

                {/* Overview cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: 'Pending', value: progressStats.pendingItems, icon: <ClipboardList className="h-4 w-4" />, color: '#0f766e', bg: 'rgba(15,118,110,0.08)', anchor: 'needs-attention' },
                    { label: 'Overdue', value: progressStats.overdueItems, icon: <AlertCircle className="h-4 w-4" />, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', anchor: 'overdue-items' },
                    { label: 'Due Soon', value: progressStats.dueSoonItems, icon: <Clock className="h-4 w-4" />, color: '#d97706', bg: 'rgba(217,119,6,0.08)', anchor: 'upcoming-due' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="rounded-2xl border p-5 text-left transition hover:shadow-md hover:-translate-y-0.5"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                            {item.label}
                          </div>
                          <div className="mt-2 text-3xl font-bold" style={{ color: item.color }}>
                            {item.value}
                          </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: item.bg, color: item.color }}>
                          {item.icon}
                        </div>
                      </div>
                      <div className="mt-2 text-[11px]" style={{ color: item.color }}>Click to view →</div>
                    </button>
                  ))}
                </div>

                {/* Upcoming Due Items */}
                <div id="upcoming-due" className="rounded-2xl border p-5"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" style={{ color: '#059669' }} />
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                      Upcoming Due Items
                    </h3>
                  </div>
                  {progressStats.upcoming.length === 0 ? (
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No upcoming deadlines.</div>
                  ) : (
                    <div className="space-y-2">
                      {progressStats.upcoming.map((item) => {
                        const href = item.kind === 'Assignment'
                          ? `/dashboard/student/assignments/${item.id.replace('assignment-', '')}`
                          : `/dashboard/student/quizzes/${item.id.replace('quiz-', '')}`;
                        return (
                          <Link key={item.id} href={href}
                            className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm hover:bg-[var(--surface-2)]"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-blue)' }}>
                                {item.kind}
                              </div>
                              <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                {item.title}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                                {new Date(item.due).toLocaleDateString()}
                              </div>
                              <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Overdue Items */}
                <div id="overdue-items" className="rounded-2xl border p-5"
                  style={{ borderColor: '#fca5a5', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" style={{ color: '#dc2626' }} />
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>
                      Overdue Items
                    </h3>
                  </div>
                  {progressStats.overdueAssignmentsList.length === 0 && progressStats.overdueQuizzesList.length === 0 ? (
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No overdue items. Great job!</div>
                  ) : (
                    <div className="space-y-2">
                      {progressStats.overdueAssignmentsList.map((a) => (
                        <Link key={a.id} href={`/dashboard/student/assignments/${a.id}`}
                          className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm"
                          style={{ borderColor: '#fca5a5', background: 'rgba(220,38,38,0.04)' }}>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">Assignment</div>
                            <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold text-rose-500">{new Date(a.due_date).toLocaleDateString()}</div>
                            <ChevronRight className="h-4 w-4 text-rose-400" />
                          </div>
                        </Link>
                      ))}
                      {progressStats.overdueQuizzesList.map((q) => (
                        <Link key={q.id} href={`/dashboard/student/quizzes/${q.id}`}
                          className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm"
                          style={{ borderColor: '#fca5a5', background: 'rgba(220,38,38,0.04)' }}>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">Quiz</div>
                            <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{q.title}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold text-rose-500">{q.due_date ? new Date(q.due_date).toLocaleDateString() : 'No due date'}</div>
                            <ChevronRight className="h-4 w-4 text-rose-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Needs Attention */}
                <div id="needs-attention" className="rounded-2xl border p-5"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Needs Attention
                  </div>
                  <div className="space-y-2">
                    {progressStats.pendingAssignmentsList.map((a) => (
                      <Link key={a.id} href={`/dashboard/student/assignments/${a.id}`}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm hover:bg-[var(--surface-2)]"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#7c3aed' }}>Assignment</div>
                          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{a.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      </Link>
                    ))}
                    {progressStats.pendingQuizzesList.map((q) => (
                      <Link key={q.id} href={`/dashboard/student/quizzes/${q.id}`}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm hover:bg-[var(--surface-2)]"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#0f766e' }}>Quiz</div>
                          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{q.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      </Link>
                    ))}
                    {progressStats.pendingAssignmentsList.length === 0 && progressStats.pendingQuizzesList.length === 0 && (
                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing needs attention right now!</div>
                    )}
                  </div>
                </div>

              </div>
            )}
            </>
        )}
      </div>

    </AppShell>
  );
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; light: string }> = {
  pdf:   { label: 'PDF',   icon: <FileText className="h-6 w-6" />,  color: '#dc2626', light: 'rgba(220,38,38,0.08)' },
  link:  { label: 'Link',  icon: <Link2 className="h-6 w-6" />,     color: '#0891b2', light: 'rgba(8,145,178,0.08)' },
  text:  { label: 'Text',  icon: <AlignLeft className="h-6 w-6" />, color: '#059669', light: 'rgba(5,150,105,0.08)' },
  image: { label: 'Image', icon: <BookOpen className="h-6 w-6" />,  color: '#7c3aed', light: 'rgba(124,58,237,0.08)' },
  video: { label: 'Video', icon: <Video className="h-6 w-6" />,     color: '#d97706', light: 'rgba(217,119,6,0.08)' },
};

function LessonDetail({ lessonId, onBack }: { lessonId: string; onBack: () => void }) {
  const { data: lesson } = useLesson(lessonId);
  const meta = TYPE_META[lesson?.content_type ?? 'text'] ?? TYPE_META.text;

  const handleOpen = () => {
    if (!lesson) return;
    if (lesson.content_type === 'pdf') {
      window.open(`/dashboard/student/lessons/${lessonId}/pdf`, '_blank');
    } else if (lesson.file_url) {
      window.open(lesson.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 -ml-1 text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Learning Materials
      </Button>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {lesson?.content_type?.toUpperCase() ?? '…'}
              </span>
              {lesson?.subject_name && (
                <span className="text-sm text-white/60">{lesson.subject_name}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">
              {lesson?.title ?? 'Loading…'}
            </h1>
            {lesson?.created_at && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                <Calendar className="h-4 w-4" />
                Added {new Date(lesson.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm" style={{ color: '#fff' }}>
            {meta.icon}
          </div>
        </div>
      </div>

      {!lesson ? (
        <div className="rounded-2xl border p-16 text-center text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
          Loading material…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Description */}
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Description</h2>
              </div>
              <div className="px-6 py-5 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {lesson.description || (
                  <span className="italic" style={{ color: 'var(--muted-foreground)' }}>No description provided.</span>
                )}
              </div>
            </div>
            {lesson.content_type === 'image' && lesson.file_url && (
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <img src={lesson.file_url} alt={lesson.title} className="w-full object-cover" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Details</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Type</span>
                  <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ background: meta.light, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                {lesson.subject_name && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Subject</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{lesson.subject_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Added</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Actions</h2>
              </div>
              <div className="flex flex-col gap-3 p-5">
                {lesson.content_type === 'link' && lesson.file_url ? (
                  <a href={lesson.file_url} target="_blank" rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: meta.color }}>
                    <ExternalLink className="h-4 w-4" />
                    Open Link
                  </a>
                ) : lesson.content_type !== 'text' && lesson.content_type !== 'image' ? (
                  <button onClick={handleOpen}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: meta.color }}>
                    <Download className="h-4 w-4" />
                    Open {meta.label}
                  </button>
                ) : null}
                <Button variant="outline" size="sm" className="w-full" onClick={onBack}>
                  <BookOpen className="h-4 w-4" />
                  Back to Materials
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentDetail({
  assignmentId, assignments, submissions, onBack,
}: {
  assignmentId: string;
  assignments: import('@/types').Assignment[];
  submissions: import('@/types').AssignmentSubmission[];
  onBack: () => void;
}) {
  const { user } = useAuth();
  const submitMutation = useSubmitAssignment();
  const assignment = assignments.find((a) => a.id === assignmentId);
  const submission = submissions.find((s) => s.assignment_id === assignmentId);

  const getStatus = (dueDate: string, sub?: typeof submission) => {
    if (sub) {
      if (sub.graded_at || typeof sub.score === 'number') return { label: 'Graded', color: '#059669', light: 'rgba(5,150,105,0.1)' };
      if (sub.submitted_at && new Date(sub.submitted_at) > new Date(dueDate)) return { label: 'Late', color: '#dc2626', light: 'rgba(220,38,38,0.1)' };
      return { label: 'Submitted', color: '#d97706', light: 'rgba(217,119,6,0.1)' };
    }
    if (!Number.isNaN(new Date(dueDate).getTime()) && new Date(dueDate) < new Date()) return { label: 'Overdue', color: '#dc2626', light: 'rgba(220,38,38,0.1)' };
    return { label: 'Pending', color: '#0891b2', light: 'rgba(8,145,178,0.1)' };
  };

  const status = assignment ? getStatus(assignment.due_date, submission) : { label: 'Pending', color: '#0891b2', light: 'rgba(8,145,178,0.1)' };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment || !user?.student?.id) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = (formData.get('text_answer') as string | null) ?? '';
    const link = (formData.get('file_url') as string | null) ?? '';
    await submitMutation.mutateAsync({
      assignment: assignment.id,
      student: user.student.id,
      text_answer: text.trim() || undefined,
      file_url: link.trim() || undefined,
    });
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 -ml-1 text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Assignments
      </Button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/60">{assignment?.subject_name ?? 'Assignment'}</p>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">{assignment?.title ?? 'Loading…'}</h1>
          </div>
          {assignment && (
            <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
              <span className="text-sm font-bold text-white">{status.label}</span>
            </div>
          )}
        </div>
      </div>

      {!assignment ? (
        <div className="rounded-2xl border p-16 text-center text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>Assignment not found.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Details */}
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Assignment Details</h2>
              </div>
              <div className="p-6">
                {assignment.description
                  ? <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{assignment.description}</p>
                  : <p className="mb-6 text-sm italic" style={{ color: 'var(--muted-foreground)' }}>No description provided.</p>}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {[
                    { icon: <BookOpen className="h-4 w-4" />, label: 'Subject', value: assignment.subject_name ?? '—' },
                    { icon: <Star className="h-4 w-4" />, label: 'Total Points', value: String(assignment.total_points) },
                    { icon: <Calendar className="h-4 w-4" />, label: 'Due Date', value: new Date(assignment.due_date).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                      <div className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.icon}{item.label}</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission */}
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                  {submission ? 'Your Submission' : 'Submit Assignment'}
                </h2>
              </div>
              <div className="p-6">
                {submission ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-4 w-4" />
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </div>
                    {submission.submission_text && (
                      <div className="rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                        <div className="border-b px-4 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Your Answer</p>
                        </div>
                        <p className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{submission.submission_text}</p>
                      </div>
                    )}
                    {submission.submission_file && (
                      <a href={submission.submission_file} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: 'var(--brand-blue)' }}>
                        <ExternalLink className="h-4 w-4" />View attachment
                      </a>
                    )}
                    <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">Teacher Feedback</p>
                        <p className="text-sm leading-relaxed text-emerald-900">{submission.feedback || 'No feedback yet.'}</p>
                      </div>
                    </div>
                    {typeof submission.score === 'number' && (
                      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ borderColor: '#6ee7b7', background: 'rgba(5,150,105,0.06)' }}>
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Score</p>
                          <p className="text-lg font-bold text-emerald-800">{submission.score} / {assignment.total_points}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }} htmlFor="text_answer">
                        Your Answer <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <textarea id="text_answer" name="text_answer" rows={6}
                        placeholder="Type your response here…"
                        className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)' }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }} htmlFor="file_url">
                        Attachment Link <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                        <Input id="file_url" name="file_url" placeholder="Paste a Google Drive or file link…" className="pl-9" />
                      </div>
                    </div>
                    <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                      {submitMutation.isPending ? 'Submitting…' : 'Submit Assignment'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="h-1.5 w-full" style={{ background: status.color }} />
              <div className="p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Status</p>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: status.light }}>
                    {status.label === 'Graded'
                      ? <CheckCircle className="h-5 w-5" style={{ color: status.color }} />
                      : <Clock className="h-5 w-5" style={{ color: status.color }} />}
                  </span>
                  <div>
                    <p className="text-base font-bold" style={{ color: status.color }}>{status.label}</p>
                    {submission?.submitted_at && (
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{new Date(submission.submitted_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
              <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Quick Info</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Subject', value: assignment.subject_name ?? '—' },
                  { label: 'Points', value: `${assignment.total_points} pts` },
                  { label: 'Due', value: new Date(assignment.due_date).toLocaleDateString() },
                  { label: 'Late allowed', value: assignment.allow_late_submission ? 'Yes' : 'No' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
      <div className="opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
