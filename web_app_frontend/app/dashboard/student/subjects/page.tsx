'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useMemo, useState } from 'react';

export default function StudentSubjectsPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: quizzes = [] } = useQuizzes();
  const [query, setQuery] = useState('');
  const filteredSubjects = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return subjects;
    return subjects.filter((subject) => {
      const haystack = [
        subject.name,
        subject.code,
        subject.description,
        subject.instructor_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [query, subjects]);
  const totalUnits = subjects.reduce((sum, subject) => sum + (subject.units ?? 0), 0);
  const avgUnits = subjects.length ? (totalUnits / subjects.length) : 0;
  const latestLessons = useMemo(
    () =>
      [...lessons]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [lessons]
  );
  const nextFocus = useMemo(() => {
    const upcomingAssignments = assignments
      .filter((assignment) => assignment.due_date)
      .map((assignment) => ({
        type: 'Assignment',
        title: assignment.title,
        due: new Date(assignment.due_date).getTime(),
      }));
    const upcomingQuizzes = quizzes
      .filter((quiz) => quiz.due_date)
      .map((quiz) => ({
        type: 'Quiz',
        title: quiz.title,
        due: new Date(quiz.due_date).getTime(),
      }));
    const upcoming = [...upcomingAssignments, ...upcomingQuizzes].filter((item) => !Number.isNaN(item.due));
    if (upcoming.length === 0) return null;
    return upcoming.sort((a, b) => a.due - b.due)[0];
  }, [assignments, quizzes]);
  return (
    <AppShell title="Student Dashboard" subtitle="Subjects" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Your subjects" description="All subjects assigned for the current semester." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Active subjects', value: `${subjects.length}`, note: subjects.length ? 'Enrolled subjects' : 'No active subjects' },
            { label: 'Total units', value: `${totalUnits}`, note: 'Sum of units for this term' },
            { label: 'Avg units / subject', value: avgUnits.toFixed(1), note: 'Average unit weight' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                <div className="mt-1 text-xs text-neutral-500">{stat.note}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white p-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search subjects"
            className="md:w-72"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Badge>Core</Badge>
            <Badge variant="outline">Lab</Badge>
            <Badge variant="outline">Elective</Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredSubjects.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                {query.trim()
                  ? `No subjects found for "${query.trim()}".`
                  : 'No subjects found.'}
              </div>
            ) : (
              filteredSubjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{subject.name}</CardTitle>
                    <Link href={`/dashboard/student/subjects/${subject.id}`} className="text-xs text-neutral-700 hover:underline">
                      View
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-neutral-600">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{subject.code}</div>
                    <div className="text-xs text-neutral-500">Instructor: {subject.instructor_name ?? 'TBA'}</div>
                    <div>{subject.description}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{subject.units} units</Badge>
                        <Badge variant="muted">On track</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {latestLessons.length === 0 ? (
                  <div className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    No lessons available yet.
                  </div>
                ) : (
                  latestLessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                      {lesson.title}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Next focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                {nextFocus ? (
                  <>
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Upcoming task</div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{nextFocus.title}</div>
                    <div className="text-xs text-neutral-500">{nextFocus.type} due {new Date(nextFocus.due).toDateString()}</div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-500">No upcoming tasks found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
