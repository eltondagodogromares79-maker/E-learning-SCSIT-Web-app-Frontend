'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import Link from 'next/link';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useTeacherStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useAttendanceSummary } from '@/features/attendance/hooks/useAttendanceSummary';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useChatContext } from '@/features/chat/hooks/useChatContext';
import { useQueries } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';

export default function TeacherDashboardPage() {
  const { data: students = [] } = useStudents();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const { data: quizzes = [] } = useQuizzes();
  const { data: attempts = [] } = useQuizAttempts();
  const { data: stats = [] } = useTeacherStats();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const { data: attendanceSummary = [] } = useAttendanceSummary();
  const { user } = useAuth();
  const { data: chatContext } = useChatContext();
  const [studentQuery, setStudentQuery] = useState('');
  const averageGrade = stats.find((stat) => stat.label === 'Average grade')?.value ?? '—';
  const pendingReviews = stats.find((stat) => stat.label === 'Pending reviews')?.value ?? '0';

  const isAdviser = user?.role === 'adviser' || chatContext?.role === 'adviser';
  const adviserSections = chatContext?.sections ?? [];
  const adviserSectionIds = useMemo(() => new Set(adviserSections.map((section) => section.id)), [adviserSections]);
  const adviserSubjects = useMemo(
    () => sectionSubjects.filter((item) => adviserSectionIds.has(item.section_id)),
    [adviserSectionIds, sectionSubjects]
  );
  const [adviserSectionFilter, setAdviserSectionFilter] = useState<string>('all');
  const adviserSectionQueries = useQueries({
    queries: adviserSections.map((section) => ({
      queryKey: ['attendance', 'summary', { section: section.id }],
      queryFn: () => attendanceService.listSummary({ section: section.id }),
      enabled: Boolean(isAdviser),
    })),
  });
  const adviserAttendanceSummary = useMemo(() => {
    if (adviserSectionFilter === 'all') {
      return adviserSectionQueries.flatMap((query) => query.data ?? []);
    }
    const match = adviserSectionQueries.find(
      (query, index) => adviserSections[index]?.id === adviserSectionFilter
    );
    return match?.data ?? [];
  }, [adviserSectionFilter, adviserSectionQueries, adviserSections]);

  const allowedStudentIds = useMemo(() => {
    if (!isAdviser) return null;
    return new Set(adviserAttendanceSummary.map((item) => item.student_id));
  }, [adviserAttendanceSummary, isAdviser]);

  const assignmentByStudent = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    submissions.forEach((submission) => {
      if (allowedStudentIds && !allowedStudentIds.has(submission.student_id)) return;
      if (typeof submission.score !== 'number') return;
      const entry = map.get(submission.student_id) ?? { sum: 0, count: 0 };
      entry.sum += submission.score;
      entry.count += 1;
      map.set(submission.student_id, entry);
    });
    return map;
  }, [allowedStudentIds, submissions]);

  const quizByStudent = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    attempts.forEach((attempt) => {
      if (allowedStudentIds && !allowedStudentIds.has(attempt.student_id)) return;
      if (typeof attempt.score !== 'number') return;
      const entry = map.get(attempt.student_id) ?? { sum: 0, count: 0 };
      entry.sum += attempt.score;
      entry.count += 1;
      map.set(attempt.student_id, entry);
    });
    return map;
  }, [allowedStudentIds, attempts]);

  const attendanceByStudent = useMemo(() => {
    const map = new Map<string, { completion: number; total: number }>();
    attendanceSummary.forEach((summary) => {
      map.set(summary.student_id, { completion: summary.completion, total: summary.total });
    });
    return map;
  }, [attendanceSummary]);
  const adviserAverageAttendance = useMemo(() => {
    if (adviserAttendanceSummary.length === 0) return 0;
    const total = adviserAttendanceSummary.reduce((sum, item) => sum + (item.completion ?? 0), 0);
    return Math.round((total / adviserAttendanceSummary.length) * 10) / 10;
  }, [adviserAttendanceSummary]);

  const adviserStudentCount = useMemo(() => {
    if (!allowedStudentIds) return adviserAttendanceSummary.length;
    return allowedStudentIds.size;
  }, [adviserAttendanceSummary.length, allowedStudentIds]);

  const adviserAssignmentAvg = useMemo(() => {
    if (!allowedStudentIds) return 0;
    let sum = 0;
    let count = 0;
    assignmentByStudent.forEach((value, studentId) => {
      if (!allowedStudentIds.has(studentId) || value.count === 0) return;
      sum += value.sum / value.count;
      count += 1;
    });
    return count ? Math.round((sum / count) * 10) / 10 : 0;
  }, [allowedStudentIds, assignmentByStudent]);

  const adviserQuizAvg = useMemo(() => {
    if (!allowedStudentIds) return 0;
    let sum = 0;
    let count = 0;
    quizByStudent.forEach((value, studentId) => {
      if (!allowedStudentIds.has(studentId) || value.count === 0) return;
      sum += value.sum / value.count;
      count += 1;
    });
    return count ? Math.round((sum / count) * 10) / 10 : 0;
  }, [allowedStudentIds, quizByStudent]);

  const filteredStudents = useMemo(() => {
    const trimmed = studentQuery.trim().toLowerCase();
    const base = students.filter((student) => {
      if (!trimmed) return true;
      const haystack = [student.user_name, student.student_number].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
    if (!isAdviser) return base;
    const allowedIds = new Set(adviserAttendanceSummary.map((item) => item.student_id));
    return base.filter((student) => allowedIds.has(student.id));
  }, [adviserAttendanceSummary, isAdviser, studentQuery, students]);

  const formatAverage = (sum: number, count: number) => {
    if (!count) return '—';
    return (sum / count).toFixed(1);
  };
  return (
    <AppShell title="Teacher Dashboard" subtitle="Welcome back" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Class performance overview"
          description="Manage lesson plans, grading, and student engagement."
        />

        <StatsGrid stats={stats} />

        <section id="classes" className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>My classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sectionSubjects.map((item) => (
                  <div key={item.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{item.subject_name}</div>
                    <div className="text-xs text-neutral-500">
                      {item.section_name}
                      {item.term_label ? ` · ${item.term_label}` : ''}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/teacher/lessons?sectionSubjectId=${item.id}`}
                        className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        Create lesson
                      </Link>
                      <Link
                        href={`/dashboard/teacher/assignments?sectionSubjectId=${item.id}`}
                        className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        Create assignment
                      </Link>
                      <Link
                        href={`/dashboard/teacher/quizzes?sectionSubjectId=${item.id}`}
                        className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                      >
                        Create quiz
                      </Link>
                    </div>
                  </div>
                ))}
                {sectionSubjects.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No classes assigned yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" id="grades">
            <CardHeader>
              <CardTitle>Students at a glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  placeholder="Search student"
                  className="md:w-72"
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                />
                <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                  <Badge variant="outline">Assignments avg</Badge>
                  <Badge variant="outline">Quizzes avg</Badge>
                  <Badge variant="outline">Attendance</Badge>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student number</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Quizzes</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const assignmentStats = assignmentByStudent.get(student.id) ?? { sum: 0, count: 0 };
                    const quizStats = quizByStudent.get(student.id) ?? { sum: 0, count: 0 };
                    const attendanceStats = attendanceByStudent.get(student.id);
                    const assignmentAvg = formatAverage(assignmentStats.sum, assignmentStats.count);
                    const quizAvg = formatAverage(quizStats.sum, quizStats.count);
                    const attendanceCompletion = attendanceStats?.completion ?? 0;
                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.user_name}</TableCell>
                        <TableCell>{student.student_number ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{assignmentAvg}</span>
                            <span className="text-xs text-neutral-500">{assignmentStats.count} graded</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{quizAvg}</span>
                            <span className="text-xs text-neutral-500">{quizStats.count} graded</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{attendanceCompletion}%</span>
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--surface-2)]">
                              <div
                                className="h-full bg-[var(--brand-blue)]"
                                style={{ width: `${Math.min(100, attendanceCompletion)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {attendanceStats?.total ?? 0} sessions
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {isAdviser ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Adviser section overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {adviserSections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No section assigned yet.
                  </div>
                ) : (
                  adviserSections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-neutral-200 p-4">
                      <div className="text-sm font-semibold text-neutral-900">{section.name}</div>
                      <div className="text-xs text-neutral-500">Assigned adviser section</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Assigned subjects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {adviserSubjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                    No subjects assigned yet.
                  </div>
                ) : (
                  adviserSubjects.map((subject) => (
                    <div key={subject.id} className="rounded-xl border border-neutral-200 p-4">
                      <div className="text-sm font-semibold text-neutral-900">{subject.subject_name}</div>
                      <div className="text-xs text-neutral-500">
                        {subject.section_name}
                        {subject.term_label ? ` · ${subject.term_label}` : ''}
                      </div>
                      {subject.teacher_name ? (
                        <div className="mt-2 text-xs text-neutral-500">Teacher: {subject.teacher_name}</div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Attendance completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-neutral-600">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Students', value: adviserStudentCount },
                    { label: 'Avg assignments', value: adviserAssignmentAvg ? `${adviserAssignmentAvg}` : '—' },
                    { label: 'Avg quizzes', value: adviserQuizAvg ? `${adviserQuizAvg}` : '—' },
                    { label: 'Avg attendance', value: `${adviserAverageAttendance}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                      <div className="mt-1 text-lg font-semibold text-neutral-900">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Filter by section</div>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm md:w-64"
                    value={adviserSectionFilter}
                    onChange={(event) => setAdviserSectionFilter(event.target.value)}
                  >
                    <option value="all">All adviser sections</option>
                    {adviserSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-[rgba(15,23,42,0.12)] bg-[var(--surface-2)] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Section average</div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                    {adviserAverageAttendance}%
                  </div>
                </div>
                <div className="space-y-2">
                  {adviserAttendanceSummary.slice(0, 6).map((item) => (
                    <div key={item.student_id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{item.student_name ?? 'Student'}</div>
                        <div className="text-xs text-neutral-500">{item.student_number ?? '—'}</div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900">{item.completion}%</div>
                    </div>
                  ))}
                  {adviserAttendanceSummary.length === 0 ? (
                    <div className="text-xs text-neutral-500">No attendance data yet.</div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section id="lessons" className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Lessons published</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                  <div className="text-xs text-neutral-500">Type {lesson.content_type.toUpperCase()} · Added {new Date(lesson.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm" id="assignments">
            <CardHeader>
            <CardTitle>Assignments scheduled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="text-sm font-semibold text-neutral-900">{assignment.title}</div>
                <div className="text-xs text-neutral-500">Due {new Date(assignment.due_date).toDateString()}</div>
                <Link
                  href={`/dashboard/teacher/assignments/${assignment.id}`}
                  className="mt-2 inline-flex text-xs font-medium text-[var(--brand-blue-deep)] hover:underline"
                >
                  View submissions
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
        </section>

        <section id="quizzes" className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quizzes in progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                  <div className="text-xs text-neutral-500">Attempts allowed: {quiz.attempt_limit}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Performance snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs text-neutral-500">Average class score</div>
                <div className="text-2xl font-semibold text-neutral-900">{averageGrade}</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs text-neutral-500">Pending reviews</div>
                <div className="text-2xl font-semibold text-neutral-900">{pendingReviews}</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
