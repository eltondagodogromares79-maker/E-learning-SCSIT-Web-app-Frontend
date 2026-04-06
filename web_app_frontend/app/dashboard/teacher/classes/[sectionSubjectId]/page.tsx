'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useUpdateLesson } from '@/features/lessons/hooks/useUpdateLesson';
import { useDeleteLesson } from '@/features/lessons/hooks/useDeleteLesson';
import { useUpdateAssignment } from '@/features/assignments/hooks/useUpdateAssignment';
import { useDeleteAssignment } from '@/features/assignments/hooks/useDeleteAssignment';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useGradeSubmission } from '@/features/assignments/hooks/useGradeSubmission';
import { useAiGradeSubmission } from '@/features/assignments/hooks/useAiGradeSubmission';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useUpdateQuiz } from '@/features/quizzes/hooks/useUpdateQuiz';
import { useDeleteQuiz } from '@/features/quizzes/hooks/useDeleteQuiz';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { quizService } from '@/features/quizzes/services/quizService';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useAttendanceRecords } from '@/features/attendance/hooks/useAttendanceRecords';
import { useCreateAttendanceSession } from '@/features/attendance/hooks/useCreateAttendanceSession';
import { useMarkAttendance } from '@/features/attendance/hooks/useMarkAttendance';
import { useEndAttendanceSession } from '@/features/attendance/hooks/useEndAttendanceSession';
import { useStartAttendanceSession } from '@/features/attendance/hooks/useStartAttendanceSession';
import { useToast } from '@/components/ui/toast';
import { env } from '@/lib/env';
import { useConfirm } from '@/components/ui/confirm';
import type { QuizProctorLog } from '@/types';

type TabKey = 'lessons' | 'assignments' | 'quizzes' | 'attendance';

const toIso = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const nowLocal = () => new Date().toISOString().slice(0, 16);
const nowDate = () => new Date().toISOString().slice(0, 10);
const isPastDate = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < Date.now();
};
const isPastDateOnly = (value?: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

function QuizAttemptsPanel({ quizId }: { quizId: string }) {
  const { data: attempts = [] } = useQuizAttempts(quizId);
  const [activeLogStudentId, setActiveLogStudentId] = useState<string | null>(null);
  const [proctorLogs, setProctorLogs] = useState<QuizProctorLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [violationsByAttempt, setViolationsByAttempt] = useState<Record<string, number>>({});
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const violationsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    violationsRef.current = violationsByAttempt;
  }, [violationsByAttempt]);

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


  useEffect(() => {
    let active = true;
    const loadViolations = async () => {
      const missing = attempts.filter((attempt) => violationsRef.current[attempt.id] === undefined);
      if (missing.length === 0) return;
      setIsLoadingViolations(true);
      try {
        const results = await Promise.all(
          missing.map(async (attempt) => {
            try {
              const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
              const count = logs.reduce(
                (sum, log) => sum + (log.events?.filter((event) => event.type === 'violation').length ?? 0),
                0
              );
              return { id: attempt.id, count };
            } catch {
              return { id: attempt.id, count: 0 };
            }
          })
        );
        if (!active) return;
        setViolationsByAttempt((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            next[item.id] = item.count;
          });
          return next;
        });
      } catch {
        // ignore
      } finally {
        if (active) {
          setIsLoadingViolations(false);
        }
      }
    };
    loadViolations();
    return () => {
      active = false;
    };
  }, [attempts, quizId]);

  if (!attempts.length) {
    return <div className="mt-3 text-xs text-neutral-500">No submissions yet.</div>;
  }

  const gradedAttempts = attempts.filter((attempt) => attempt.score !== undefined && attempt.score !== null);
  const avgScore =
    gradedAttempts.length > 0
      ? Math.round((gradedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / gradedAttempts.length) * 10) / 10
      : 0;
  const visibleAttempts = attempts;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <div>Total: {attempts.length}</div>
        <div>Graded: {gradedAttempts.length}</div>
        <div>Avg score: {gradedAttempts.length ? avgScore : '—'}</div>
      </div>
      <div className="rounded-xl border border-neutral-200/70 bg-white/80 px-3 py-2 text-xs text-neutral-600">
        Showing all attempts.
      </div>
      {visibleAttempts.map((attempt) => {
        const hasManualAnswers = Boolean(
          attempt.answers?.some((answer) => answer.question_type === 'essay' || answer.question_type === 'identification')
        );
        const totalPoints =
          attempt.answers?.reduce((sum, answer) => sum + (answer.question_points ?? 0), 0) ?? 0;
        const violationCount = violationsByAttempt[attempt.id];
        const isSubmitted = Boolean(attempt.submitted_at);
        return (
        <div key={attempt.id} className="rounded-3xl border border-neutral-200/70 bg-white/90 p-5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
                className="text-sm font-semibold text-neutral-900 hover:text-[var(--brand-blue-deep)]"
              >
                {attempt.student_name ?? attempt.student_id}
              </Link>
              <div className="mt-1 text-xs text-neutral-500">
                {attempt.submitted_at ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}` : 'In progress'}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                  {isSubmitted ? 'Submitted' : 'In progress'}
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                  Duration: {formatDuration(attempt.started_at, attempt.submitted_at)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    typeof violationCount === 'number' && violationCount > 0
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  Violations:{' '}
                  {typeof violationCount === 'number'
                    ? violationCount
                    : isLoadingViolations
                    ? '…'
                    : '0'}
                </span>
                {hasManualAnswers && (attempt.score === undefined || attempt.score === null) ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                    Manual grading needed
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-semibold text-neutral-700">Score</div>
              <div className="text-2xl font-semibold text-neutral-900">
                {attempt.score ?? 0} / {totalPoints}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              as={Link}
              href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
              disabled={!attempt.answers || attempt.answers.length === 0}
            >
              Review answers
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (activeLogStudentId === attempt.student_id) {
                  setActiveLogStudentId(null);
                  setProctorLogs([]);
                  return;
                }
                setIsLoadingLogs(true);
                setActiveLogStudentId(attempt.student_id);
                try {
                  const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
                  setProctorLogs(logs);
                  const count = logs.reduce(
                    (sum, log) => sum + (log.events?.filter((event) => event.type === 'violation').length ?? 0),
                    0
                  );
                  setViolationsByAttempt((prev) => ({ ...prev, [attempt.id]: count }));
                } finally {
                  setIsLoadingLogs(false);
                }
              }}
            >
              {activeLogStudentId === attempt.student_id ? 'Hide proctor logs' : 'View proctor logs'}
            </Button>
          </div>
          {activeLogStudentId === attempt.student_id ? (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-[var(--surface-2)] p-3 text-xs text-neutral-600">
              {isLoadingLogs ? (
                <div>Loading logs…</div>
              ) : proctorLogs.length === 0 ? (
                <div>No proctor logs found.</div>
              ) : (
                proctorLogs.map((log) => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        {log.status}
                      </span>
                      <span>Warnings: {log.warnings}</span>
                      <span>Terminations: {log.terminations}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {log.events.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-md border border-neutral-200 bg-white p-2">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{event.type}</div>
                          <div>{event.detail ?? '—'}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(event.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    {log.snapshots.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.snapshots.slice(0, 4).map((shot) => (
                          <a key={shot.id} href={shot.image_url} target="_blank" className="text-blue-600 hover:underline">
                            Snapshot ({shot.reason ?? 'captured'})
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-500">No snapshots captured.</div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      );
      })}
      {visibleAttempts.length === 0 ? (
        <div className="text-xs text-neutral-500">No submissions match this filter.</div>
      ) : null}
    </div>
  );
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const sectionSubjectId = params.sectionSubjectId as string;
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: quizzes = [] } = useQuizzes();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const gradeSubmission = useGradeSubmission();
  const aiGradeSubmission = useAiGradeSubmission();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const apiBase = env.API_BASE_URL;

  const [activeTab, setActiveTab] = useState<TabKey>('lessons');
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState('');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState('');
  const [expandedQuizId, setExpandedQuizId] = useState('');
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [gradeState, setGradeState] = useState<Record<string, string>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionTimeliness, setSubmissionTimeliness] = useState<'all' | 'late' | 'on_time'>('all');
  const [attendanceTitle, setAttendanceTitle] = useState('');
  const [attendanceDateTime, setAttendanceDateTime] = useState('');
  const [attendanceOnline, setAttendanceOnline] = useState(false);
  const [activeAttendanceSessionId, setActiveAttendanceSessionId] = useState('');

  const sectionSubject = sectionSubjects.find((item) => item.id === sectionSubjectId);
  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.section_subject_id === sectionSubjectId),
    [lessons, sectionSubjectId]
  );
  const filteredAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.section_subject_id === sectionSubjectId),
    [assignments, sectionSubjectId]
  );
  const filteredQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.section_subject_id === sectionSubjectId),
    [quizzes, sectionSubjectId]
  );
  const { data: attendanceSessions = [] } = useAttendanceSessions({ section_subject: sectionSubjectId });
  const { data: attendanceRecords = [] } = useAttendanceRecords(activeAttendanceSessionId);
  const createAttendanceSession = useCreateAttendanceSession();
  const markAttendance = useMarkAttendance(activeAttendanceSessionId);
  const endAttendanceSession = useEndAttendanceSession();
  const startAttendanceSession = useStartAttendanceSession();

  const lessonsCount = filteredLessons.length;
  const assignmentsCount = filteredAssignments.length;
  const quizzesCount = filteredQuizzes.length;
  const attendanceCount = attendanceSessions.length;

  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => filteredAssignments.some((assignment) => assignment.id === submission.assignment_id)),
    [submissions, filteredAssignments]
  );

  const attendanceCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    attendanceRecords.forEach((rec) => {
      counts[rec.status] += 1;
    });
    return counts;
  }, [attendanceRecords]);

  const startEditLesson = (id: string, title: string, description?: string) => {
    setEditingLessonId(id);
    setFormState({
      title,
      description: description ?? '',
    });
  };

  const startEditAssignment = (id: string, title: string, description: string | undefined, dueDate: string, totalPoints: number, allowLate: boolean) => {
    setEditingAssignmentId(id);
    setFormState({
      title,
      description: description ?? '',
      due_date: dueDate.slice(0, 10),
      total_points: String(totalPoints),
      allow_late_submission: allowLate ? 'yes' : 'no',
    });
  };

  const startEditQuiz = (
    id: string,
    title: string,
    description: string | undefined,
    dueDate: string | undefined,
    totalPoints: number,
    timeLimit: number | undefined,
    attemptLimit: number,
    aiGradeOnSubmit?: boolean
  ) => {
    setEditingQuizId(id);
    setFormState({
      title,
      description: description ?? '',
      due_date: dueDate ? dueDate.slice(0, 10) : '',
      total_points: String(totalPoints),
      time_limit_minutes: timeLimit ? String(timeLimit) : '',
      attempt_limit: String(attemptLimit),
      ai_grade_on_submit: aiGradeOnSubmit ? 'yes' : 'no',
    });
  };

  const resetEditing = () => {
    setEditingLessonId('');
    setEditingAssignmentId('');
    setEditingQuizId('');
    setFormState({});
  };

  const handleOpenLessonFile = async (lessonId: string) => {
    try {
      const downloadUrl = `${apiBase}/api/learning-materials/${lessonId}/download/`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast({ title: 'PDF unavailable', description: 'Unable to load the PDF file.', variant: 'error' });
    }
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Class Details" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={sectionSubject ? `${sectionSubject.subject_name}` : 'Class detail'}
          description={sectionSubject ? `${sectionSubject.section_name}${sectionSubject.term_label ? ` · ${sectionSubject.term_label}` : ''}` : 'Manage lessons, assignments, and quizzes.'}
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
            {(['lessons', 'assignments', 'quizzes', 'attendance'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-[var(--brand-blue-deep)] text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab === 'lessons'
                  ? `Lessons (${lessonsCount})`
                  : tab === 'assignments'
                  ? `Assignments (${assignmentsCount})`
                  : tab === 'quizzes'
                  ? `Quizzes (${quizzesCount})`
                  : `Attendance (${attendanceCount})`}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href={`/dashboard/teacher/lessons?sectionSubjectId=${sectionSubjectId}`}
              className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
            >
              New lesson
            </Link>
            <Link
              href={`/dashboard/teacher/assignments?sectionSubjectId=${sectionSubjectId}`}
              className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
            >
              New assignment
            </Link>
            <Link
              href={`/dashboard/teacher/quizzes?sectionSubjectId=${sectionSubjectId}`}
              className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
            >
              New quiz
            </Link>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{activeTab === 'lessons' ? 'Lessons' : activeTab === 'assignments' ? 'Assignments' : 'Quizzes'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === 'lessons' && (
              <>
                {filteredLessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-xl border border-neutral-200 p-4">
                    {editingLessonId === lesson.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input
                            value={formState.title ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea
                            rows={3}
                            className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={formState.description ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 md:col-span-2">
                          <Button
                            onClick={async () => {
                              await updateLesson.mutateAsync({
                                id: lesson.id,
                                data: {
                                  title: formState.title?.trim() || lesson.title,
                                  description: formState.description?.trim() || '',
                                },
                              });
                              resetEditing();
                            }}
                          >
                            Save changes
                          </Button>
                          <Button variant="secondary" onClick={resetEditing}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                        <div className="text-xs text-neutral-500">{lesson.content_type.toUpperCase()}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setExpandedLessonId((prev) => (prev === lesson.id ? '' : lesson.id))
                            }
                          >
                            {expandedLessonId === lesson.id ? 'Hide' : 'View'}
                          </Button>
                          <Button variant="secondary" onClick={() => startEditLesson(lesson.id, lesson.title, lesson.description)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete lesson?',
                              description: 'This lesson will be removed for everyone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              danger: true,
                            });
                            if (!ok) return;
                              await deleteLesson.mutateAsync(lesson.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                        {expandedLessonId === lesson.id && (
                          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div className="font-semibold text-neutral-900">Lesson details</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">Description</div>
                            <div className="mt-1 text-sm text-neutral-700">
                              {lesson.description || 'No description'}
                            </div>
                            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-400">Resource</div>
                            {lesson.file_url ? (
                              <Button variant="secondary" onClick={() => handleOpenLessonFile(lesson.id)}>
                                Open file
                              </Button>
                            ) : (
                              <div className="mt-1 text-sm text-neutral-600">No file attached</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {filteredLessons.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No lessons yet.
                  </div>
                )}
              </>
            )}

            {activeTab === 'assignments' && (
              <>
                {filteredAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-neutral-200 p-4">
                    {editingAssignmentId === assignment.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input
                            value={formState.title ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea
                            rows={3}
                            className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={formState.description ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input
                            type="date"
                            min={nowDate()}
                            value={formState.due_date ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, due_date: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                          <Input
                            type="number"
                            value={formState.total_points ?? '0'}
                            onChange={(event) => setFormState((prev) => ({ ...prev, total_points: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Allow late</label>
                          <select
                            className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={formState.allow_late_submission ?? 'no'}
                            onChange={(event) => setFormState((prev) => ({ ...prev, allow_late_submission: event.target.value }))}
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </div>
                        <div className="flex gap-2 md:col-span-2">
                          <Button
                            onClick={async () => {
                              if (isPastDateOnly(formState.due_date ?? assignment.due_date)) {
                                showToast({
                                  title: 'Invalid date',
                                  description: 'Due date must be today or in the future.',
                                  variant: 'error',
                                });
                                return;
                              }
                              await updateAssignment.mutateAsync({
                                id: assignment.id,
                                data: {
                                  title: formState.title?.trim() || assignment.title,
                                  description: formState.description?.trim() || '',
                                  total_points: Number(formState.total_points ?? assignment.total_points),
                                  due_date: toIso(formState.due_date ?? assignment.due_date),
                                  allow_late_submission: (formState.allow_late_submission ?? 'no') === 'yes',
                                },
                              });
                              resetEditing();
                            }}
                          >
                            Save changes
                          </Button>
                          <Button variant="secondary" onClick={resetEditing}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-neutral-900">{assignment.title}</div>
                        <div className="text-xs text-neutral-500">Due {new Date(assignment.due_date).toDateString()}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setExpandedAssignmentId((prev) => (prev === assignment.id ? '' : assignment.id))
                            }
                          >
                            {expandedAssignmentId === assignment.id ? 'Hide' : 'View'}
                          </Button>
                          <Button variant="secondary" onClick={() => startEditAssignment(
                            assignment.id,
                            assignment.title,
                            assignment.description,
                            assignment.due_date,
                            assignment.total_points,
                            assignment.allow_late_submission
                          )}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete assignment?',
                              description: 'This assignment will be removed for everyone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              danger: true,
                            });
                            if (!ok) return;
                              await deleteAssignment.mutateAsync(assignment.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                        {expandedAssignmentId === assignment.id && (
                          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div className="font-semibold text-neutral-900">Assignment details</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">Description</div>
                            <div className="mt-1 text-sm text-neutral-700">
                              {assignment.description || 'No description'}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-700">
                              <div>Points: {assignment.total_points}</div>
                              <div>Allow late: {assignment.allow_late_submission ? 'Yes' : 'No'}</div>
                            </div>
                            <div className="mt-4">
                              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Submissions</div>
                              {(() => {
                                const allSubs = filteredSubmissions.filter((submission) => submission.assignment_id === assignment.id);
                                const gradedSubs = allSubs.filter((submission) => submission.score !== undefined && submission.score !== null);
                                const avgScore =
                                  gradedSubs.length > 0
                                    ? Math.round(
                                        (gradedSubs.reduce((sum, submission) => sum + (submission.score ?? 0), 0) / gradedSubs.length) * 10
                                      ) / 10
                                    : 0;
                                const visibleSubs =
                                  assignmentFilter === 'graded'
                                    ? gradedSubs
                                    : assignmentFilter === 'ungraded'
                                    ? allSubs.filter((submission) => submission.score === undefined || submission.score === null)
                                    : allSubs;
                                const timedSubs =
                                  submissionTimeliness === 'late'
                                    ? visibleSubs.filter((submission) => {
                                        const submittedAt = new Date(submission.submitted_at);
                                        const due = new Date(assignment.due_date);
                                        return !Number.isNaN(submittedAt.getTime()) && !Number.isNaN(due.getTime()) && submittedAt > due;
                                      })
                                    : submissionTimeliness === 'on_time'
                                    ? visibleSubs.filter((submission) => {
                                        const submittedAt = new Date(submission.submitted_at);
                                        const due = new Date(assignment.due_date);
                                        return !Number.isNaN(submittedAt.getTime()) && !Number.isNaN(due.getTime()) && submittedAt <= due;
                                      })
                                    : visibleSubs;
                                const loweredSearch = submissionSearch.trim().toLowerCase();
                                const searchedSubs = loweredSearch
                                  ? timedSubs.filter((submission) => {
                                      const haystack = `${submission.student_name ?? ''} ${submission.student_id ?? ''}`.toLowerCase();
                                      return haystack.includes(loweredSearch);
                                    })
                                  : timedSubs;
                                return (
                                  <>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                                      <div>Total: {allSubs.length}</div>
                                      <div>Graded: {gradedSubs.length}</div>
                                      <div>Avg score: {gradedSubs.length ? avgScore : '—'}</div>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => assignmentService.downloadAllSubmissions(assignment.id)}
                                      >
                                        Download all
                                      </Button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant={assignmentFilter === 'all' ? 'default' : 'secondary'}
                                        onClick={() => setAssignmentFilter('all')}
                                      >
                                        All
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={assignmentFilter === 'graded' ? 'default' : 'secondary'}
                                        onClick={() => setAssignmentFilter('graded')}
                                      >
                                        Graded
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={assignmentFilter === 'ungraded' ? 'default' : 'secondary'}
                                        onClick={() => setAssignmentFilter('ungraded')}
                                      >
                                        Ungraded
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={submissionTimeliness === 'late' ? 'default' : 'secondary'}
                                        onClick={() => setSubmissionTimeliness('late')}
                                      >
                                        Late
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={submissionTimeliness === 'on_time' ? 'default' : 'secondary'}
                                        onClick={() => setSubmissionTimeliness('on_time')}
                                      >
                                        On time
                                      </Button>
                                      <Input
                                        placeholder="Search student"
                                        value={submissionSearch}
                                        onChange={(event) => setSubmissionSearch(event.target.value)}
                                        className="h-8 w-40 text-xs"
                                      />
                                    </div>
                                    <div className="mt-2 space-y-3">
                                      {searchedSubs.map((submission) => {
                                        const currentScore =
                                          gradeState[submission.id] ??
                                          (submission.score !== undefined && submission.score !== null ? String(submission.score) : '');
                                        const currentFeedback = feedbackState[submission.id] ?? (submission.feedback ?? '');
                                        const initials = (submission.student_name ?? submission.student_id ?? 'S')
                                          .split(' ')
                                          .map((part) => part[0])
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase();
                                        return (
                                          <div
                                            key={submission.id}
                                            className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-white/90 p-4 shadow-sm"
                                          >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                              <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(15,23,42,0.08)] text-xs font-semibold text-neutral-700">
                                                  {initials}
                                                </div>
                                                <div>
                                                  <div className="text-sm font-semibold text-neutral-900">
                                                    {submission.student_name ?? submission.student_id}
                                                  </div>
                                                  <div className="text-xs text-neutral-500">
                                                    Submitted {new Date(submission.submitted_at).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <div className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] px-3 py-2 text-center">
                                                  <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Score</div>
                                                  <div className="text-lg font-semibold text-neutral-900">
                                                    {submission.score ?? '—'}
                                                  </div>
                                                </div>
                                                <div className="text-xs text-neutral-500">
                                                  {submission.score !== undefined && submission.score !== null ? 'Graded' : 'Ungraded'}
                                                </div>
                                              </div>
                                            </div>
                                            {submission.submission_text ? (
                                              <div className="mt-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-3 text-xs text-neutral-700">
                                                <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Response</div>
                                                <div className="mt-1">{submission.submission_text}</div>
                                              </div>
                                            ) : null}
                                            {submission.submission_file ? (
                                              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.12)] bg-white px-3 py-1 text-xs text-neutral-600">
                                                <a
                                                  href={submission.submission_file}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="font-medium text-[var(--brand-blue-deep)] hover:underline"
                                                >
                                                  View attachment
                                                </a>
                                              </div>
                                            ) : null}
                                            <div className="mt-4 grid gap-3 md:grid-cols-[120px,1fr,auto]">
                                              <Input
                                                placeholder="Score"
                                                value={currentScore}
                                                onChange={(event) =>
                                                  setGradeState((prev) => ({ ...prev, [submission.id]: event.target.value }))
                                                }
                                                className="h-9 text-xs"
                                              />
                                              <textarea
                                                rows={2}
                                                placeholder="Feedback"
                                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700"
                                                value={currentFeedback}
                                                onChange={(event) =>
                                                  setFeedbackState((prev) => ({ ...prev, [submission.id]: event.target.value }))
                                                }
                                              />
                                              <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                  size="sm"
                                                  onClick={async () => {
                                                    const scoreValue = currentScore.trim() === '' ? undefined : Number(currentScore);
                                                    if (scoreValue !== undefined && Number.isNaN(scoreValue)) return;
                                                    await gradeSubmission.mutateAsync({
                                                      submissionId: submission.id,
                                                      score: scoreValue,
                                                      feedback: currentFeedback,
                                                    });
                                                  }}
                                                >
                                                  Save
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={() => aiGradeSubmission.mutateAsync(submission.id)}
                                                >
                                                  AI grade
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={async () => {
                                                    await gradeSubmission.mutateAsync({
                                                      submissionId: submission.id,
                                                      score: null,
                                                      feedback: '',
                                                    });
                                                    setGradeState((prev) => ({ ...prev, [submission.id]: '' }));
                                                    setFeedbackState((prev) => ({ ...prev, [submission.id]: '' }));
                                                  }}
                                                >
                                                  Clear grade
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {searchedSubs.length === 0 && (
                                        <div className="text-xs text-neutral-500">
                                          {loweredSearch ? 'No matches for this search.' : 'No submissions yet.'}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {filteredAssignments.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No assignments yet.
                  </div>
                )}
              </>
            )}

            {activeTab === 'quizzes' && (
              <>
                {filteredQuizzes.map((quiz) => (
                  <div key={quiz.id} className="rounded-xl border border-neutral-200 p-4">
                    {editingQuizId === quiz.id ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input
                            value={formState.title ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea
                            rows={3}
                            className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={formState.description ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input
                            type="date"
                            value={formState.due_date ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, due_date: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                          <Input
                            type="number"
                            value={formState.total_points ?? '0'}
                            onChange={(event) => setFormState((prev) => ({ ...prev, total_points: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                          <Input
                            type="number"
                            value={formState.time_limit_minutes ?? ''}
                            onChange={(event) => setFormState((prev) => ({ ...prev, time_limit_minutes: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                          <Input
                            type="number"
                            value={formState.attempt_limit ?? '1'}
                            onChange={(event) => setFormState((prev) => ({ ...prev, attempt_limit: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                          <select
                            className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={formState.ai_grade_on_submit ?? 'yes'}
                            onChange={(event) => setFormState((prev) => ({ ...prev, ai_grade_on_submit: event.target.value }))}
                          >
                            <option value="yes">Enabled</option>
                            <option value="no">Disabled</option>
                          </select>
                        </div>
                        <div className="flex gap-2 md:col-span-2">
                          <Button
                            onClick={async () => {
                              await updateQuiz.mutateAsync({
                                id: quiz.id,
                                data: {
                                  title: formState.title?.trim() || quiz.title,
                                  description: formState.description?.trim() || '',
                                  total_points: Number(formState.total_points ?? quiz.total_points),
                                  due_date: formState.due_date ? toIso(formState.due_date) : undefined,
                                  time_limit_minutes: formState.time_limit_minutes ? Number(formState.time_limit_minutes) : undefined,
                                  attempt_limit: Number(formState.attempt_limit ?? quiz.attempt_limit),
                                  ai_grade_on_submit: (formState.ai_grade_on_submit ?? 'yes') === 'yes',
                                },
                              });
                              resetEditing();
                            }}
                          >
                            Save changes
                          </Button>
                          <Button variant="secondary" onClick={resetEditing}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                        <div className="text-xs text-neutral-500">Attempts {quiz.attempt_limit}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button as={Link} variant="secondary" href={`/dashboard/teacher/quizzes/${quiz.id}/submissions`}>
                            View submissions
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setExpandedQuizId((prev) => (prev === quiz.id ? '' : quiz.id))
                            }
                          >
                            {expandedQuizId === quiz.id ? 'Hide details' : 'Details'}
                          </Button>
                          <Link
                            href={`/dashboard/teacher/quizzes/${quiz.id}/proctor-logs`}
                            className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                          >
                            Proctor logs
                          </Link>
                          <Button variant="secondary" onClick={() => startEditQuiz(
                            quiz.id,
                            quiz.title,
                            quiz.description,
                            quiz.due_date,
                            quiz.total_points,
                            quiz.time_limit_minutes,
                            quiz.attempt_limit,
                            quiz.ai_grade_on_submit
                          )}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete quiz?',
                              description: 'This quiz will be removed for everyone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              danger: true,
                            });
                            if (!ok) return;
                              await deleteQuiz.mutateAsync(quiz.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                        {expandedQuizId === quiz.id && (
                          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div className="font-semibold text-neutral-900">Quiz details</div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">Description</div>
                            <div className="mt-1 text-sm text-neutral-700">
                              {quiz.description || 'No description'}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-700">
                              <div>Points: {quiz.total_points}</div>
                              <div>Time limit: {quiz.time_limit_minutes ?? 'None'} minutes</div>
                              <div>Attempts: {quiz.attempt_limit}</div>
                            </div>
                            <div className="mt-4">
                              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Submissions</div>
                              <QuizAttemptsPanel quizId={quiz.id} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {filteredQuizzes.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No quizzes yet.
                  </div>
                )}
              </>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
                  <CardHeader>
                    <CardTitle>Create attendance session</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                      <Input
                        value={attendanceTitle}
                        onChange={(event) => setAttendanceTitle(event.target.value)}
                        placeholder="Class meeting"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Date & time</label>
                      <Input
                        type="datetime-local"
                        min={nowLocal()}
                        value={attendanceDateTime}
                        onChange={(event) => setAttendanceDateTime(event.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] px-3 py-2 text-sm text-neutral-600 md:col-span-3">
                      <input
                        id="attendance-online-toggle"
                        type="checkbox"
                        checked={attendanceOnline}
                        onChange={(event) => setAttendanceOnline(event.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      <label htmlFor="attendance-online-toggle">Online class (Jitsi)</label>
                    </div>
                    <div className="md:col-span-3">
                      <Button
                        disabled={!attendanceDateTime || createAttendanceSession.isPending}
                        onClick={() => {
                          if (!attendanceDateTime) return;
                          if (isPastDate(attendanceDateTime)) {
                            showToast({
                              title: 'Invalid date',
                              description: 'Schedule must be today or in the future.',
                              variant: 'error',
                            });
                            return;
                          }
                          const iso = new Date(attendanceDateTime).toISOString();
                          createAttendanceSession.mutate({
                            section_subject: sectionSubjectId,
                            title: attendanceTitle.trim() || undefined,
                            scheduled_at: iso,
                            is_online_class: attendanceOnline,
                          });
                          setAttendanceTitle('');
                          setAttendanceDateTime('');
                          setAttendanceOnline(false);
                        }}
                      >
                        {createAttendanceSession.isPending ? 'Creating…' : 'Create session'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
                  <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
                    <CardHeader>
                      <CardTitle>Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {attendanceSessions.length === 0 ? (
                        <div className="text-sm text-neutral-500">No attendance sessions yet.</div>
                      ) : (
                        attendanceSessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setActiveAttendanceSessionId(session.id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                              activeAttendanceSessionId === session.id
                                ? 'border-[var(--brand-blue)] bg-[rgba(37,99,235,0.08)]'
                                : 'border-[rgba(15,23,42,0.12)] bg-white hover:bg-[var(--surface-2)]'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-neutral-900">{session.title || 'Attendance session'}</div>
                              <div className="text-xs text-neutral-500">
                                {new Date(session.scheduled_at).toLocaleString()}
                                {session.is_online_class ? ' • Online class' : ''}
                              </div>
                            </div>
                            <div className="text-xs text-neutral-500">{session.section_name}</div>
                          </button>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-[rgba(15,23,42,0.08)] bg-white/95 shadow-sm">
                    <CardHeader>
                      <CardTitle>Mark attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!activeAttendanceSessionId ? (
                        <div className="text-sm text-neutral-500">Select a session to mark attendance.</div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                            <div>
                              Joined: {(activeSession?.present_count ?? 0) + (activeSession?.late_count ?? 0) + (activeSession?.excused_count ?? 0)}
                              {' '} / {activeSession?.total_count ?? attendanceRecords.length}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {activeSession?.is_online_class ? (
                                <Button
                                  disabled={startAttendanceSession.isPending || Boolean(activeSession?.ended_at) || Boolean(activeSession?.is_live)}
                                  onClick={async () => {
                                    if (!activeAttendanceSessionId) return;
                                    try {
                                      const result = await startAttendanceSession.mutateAsync(activeAttendanceSessionId);
                                      const url = result?.join_url ?? activeSession?.join_url;
                                      if (url) {
                                        window.open(url, '_blank');
                                      }
                                    } catch {
                                      // ignore
                                    }
                                  }}
                                >
                                  {activeSession?.ended_at
                                    ? 'Class ended'
                                    : activeSession?.is_live
                                    ? 'Class live'
                                    : startAttendanceSession.isPending
                                    ? 'Starting…'
                                    : 'Start class'}
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                disabled={endAttendanceSession.isPending || Boolean(activeSession?.ended_at)}
                                onClick={() => {
                                  if (!activeAttendanceSessionId) return;
                                  endAttendanceSession.mutate(activeAttendanceSessionId);
                                }}
                              >
                                {activeSession?.ended_at ? 'Class ended' : endAttendanceSession.isPending ? 'Ending…' : 'End class'}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                            <div className="rounded-lg border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-3">
                              Present: {attendanceCounts.present}
                            </div>
                            <div className="rounded-lg border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-3">
                              Absent: {attendanceCounts.absent}
                            </div>
                            <div className="rounded-lg border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-3">
                              Late: {attendanceCounts.late}
                            </div>
                            <div className="rounded-lg border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-3">
                              Excused: {attendanceCounts.excused}
                            </div>
                          </div>
                          <div className="max-h-[420px] space-y-3 overflow-auto pr-2">
                            {attendanceRecords.map((record) => (
                              <div key={record.id} className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-900">
                                      {record.student_name ?? 'Student'}
                                    </div>
                                    <div className="text-xs text-neutral-500">{record.student_number ?? record.student}</div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() => markAttendance.mutate([{ id: record.id, status }])}
                                        className={`rounded-full border px-3 py-1 text-[11px] capitalize ${
                                          record.status === status
                                            ? 'border-[var(--brand-blue)] bg-[rgba(37,99,235,0.12)] text-[var(--brand-blue-deep)]'
                                            : 'border-[rgba(15,23,42,0.12)] text-neutral-500 hover:bg-[var(--surface-2)]'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
