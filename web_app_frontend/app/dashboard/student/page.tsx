'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { studentNav } from '@/components/navigation/nav-config';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useGrades } from '@/features/grades/hooks/useGrades';
import { useProgress } from '@/features/progress/hooks/useProgress';
import { useStudentStats } from '@/features/dashboard/hooks/useDashboardStats';

export default function StudentDashboardPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: quizzes = [] } = useQuizzes();
  const { data: grades = [] } = useGrades();
  const { data: progress } = useProgress();
  const { data: stats = [] } = useStudentStats();
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.code, subject.name]));
  return (
    <AppShell title="Student Dashboard" subtitle="Welcome back" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Your learning overview"
          description="Stay on track with upcoming work and performance insights."
        />

        <StatsGrid stats={stats} />

        <section id="subjects" className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Active subjects</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-4">
                  <div className="text-sm font-semibold text-neutral-900">{subject.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">{subject.code} · {subject.units} units</div>
                  <div className="mt-2 text-xs text-neutral-500">{subject.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="progress">
            <CardHeader>
              <CardTitle>Progress snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-4">
                <div className="text-xs text-neutral-500">Completion rate</div>
                <div className="text-2xl font-semibold text-neutral-900">{progress?.completionRate ?? 0}%</div>
              </div>
              <div className="grid gap-3">
                {progress?.goals?.map((goal) => (
                  <div key={goal.label} className="rounded-lg border border-[rgba(17,17,17,0.12)] p-3">
                    <div className="text-xs text-neutral-500">{goal.label}</div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {goal.value} / {goal.target}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="lessons" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] p-4">
                  <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">Type: {lesson.content_type.toUpperCase()}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="assignments">
            <CardHeader>
              <CardTitle>Assignments due</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] p-4">
                  <div className="text-sm font-semibold text-neutral-900">{assignment.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">Due {new Date(assignment.due_date).toDateString()}</div>
                  <div className="mt-1 text-xs text-neutral-500">Total points: {assignment.total_points}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="quizzes" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] p-4">
                  <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">Attempts: {quiz.attempt_limit}</div>
                  <div className="mt-1 text-xs text-neutral-500">Due {quiz.due_date ? new Date(quiz.due_date).toDateString() : 'TBA'}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="grades">
            <CardHeader>
              <CardTitle>Recent grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{subjectLookup[grade.subject_code] ?? grade.subject_code}</TableCell>
                      <TableCell>{grade.school_year ?? '—'}</TableCell>
                      <TableCell>{grade.grade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
