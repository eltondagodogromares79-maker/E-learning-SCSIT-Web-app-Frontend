'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentNav } from '@/components/navigation/nav-config';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';

function useQuery() {
  const params = useSearchParams();
  return params.get('q') ?? '';
}

export default function StudentSearchPage() {
  const query = useQuery();
  const normalized = query.trim().toLowerCase();
  const { data: subjects = [] } = useSubjects();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: quizzes = [] } = useQuizzes();

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        [subject.name, subject.code, subject.description].filter(Boolean).join(' ').toLowerCase().includes(normalized)
      ),
    [subjects, normalized]
  );
  const filteredLessons = useMemo(
    () =>
      lessons.filter((lesson) =>
        [lesson.title, lesson.description, lesson.subject_code, lesson.subject_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      ),
    [lessons, normalized]
  );
  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) =>
        [assignment.title, assignment.description, assignment.subject_code, assignment.subject_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      ),
    [assignments, normalized]
  );
  const filteredQuizzes = useMemo(
    () =>
      quizzes.filter((quiz) =>
        [quiz.title, quiz.description, quiz.subject_name].filter(Boolean).join(' ').toLowerCase().includes(normalized)
      ),
    [quizzes, normalized]
  );

  return (
    <AppShell title="Student Dashboard" subtitle="Search" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Search results" description={query ? `Showing results for "${query}"` : 'Type a search term.'} />

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredSubjects.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching subjects.</div>
              ) : (
                filteredSubjects.map((subject) => (
                  <div key={subject.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{subject.name}</div>
                    <div className="text-xs text-neutral-500">{subject.code}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredLessons.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching lessons.</div>
              ) : (
                filteredLessons.map((lesson) => (
                  <Link key={lesson.id} href={`/dashboard/student/lessons/${lesson.id}`} className="block rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                    <div className="text-xs text-neutral-500">{lesson.subject_code ?? 'Lesson'}</div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching assignments.</div>
              ) : (
                filteredAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/dashboard/student/assignments/${assignment.id}`}
                    className="block rounded-xl border border-neutral-200 p-4"
                  >
                    <div className="text-sm font-semibold text-neutral-900">{assignment.title}</div>
                    <div className="text-xs text-neutral-500">Due {new Date(assignment.due_date).toDateString()}</div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredQuizzes.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching quizzes.</div>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <Link key={quiz.id} href="/dashboard/student/quizzes" className="block rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                    <div className="text-xs text-neutral-500">
                      Due {quiz.due_date ? new Date(quiz.due_date).toDateString() : 'TBA'}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
