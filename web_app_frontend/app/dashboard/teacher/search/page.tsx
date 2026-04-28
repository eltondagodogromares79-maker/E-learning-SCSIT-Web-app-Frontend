'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { TeacherRowsSkeleton } from '@/components/layout/TeacherListSkeletons';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';

function useQuery() {
  const params = useSearchParams();
  return params.get('q') ?? '';
}

function TeacherSearchPageInner() {
  const query = useQuery();
  const normalized = query.trim().toLowerCase();
  const { data: sectionSubjects = [], isLoading: classesLoading } = useSectionSubjects();
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const showSearchSkeleton = useReliableSkeleton(
    classesLoading || lessonsLoading || assignmentsLoading || quizzesLoading || studentsLoading
  );

  const filteredClasses = useMemo(
    () =>
      sectionSubjects.filter((subject) =>
        [subject.subject_name, subject.section_name, subject.term_label, subject.teacher_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      ),
    [sectionSubjects, normalized]
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
  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        [student.user_name, student.student_number].filter(Boolean).join(' ').toLowerCase().includes(normalized)
      ),
    [students, normalized]
  );

  return (
    <AppShell title="Teacher Dashboard" subtitle="Search" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader title="Search results" description={query ? `Showing results for "${query}"` : 'Type a search term.'} />

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showSearchSkeleton ? (
                <TeacherRowsSkeleton count={4} />
              ) : filteredClasses.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching classes.</div>
              ) : (
                filteredClasses.map((item) => (
                  <div key={item.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{item.subject_name}</div>
                    <div className="text-xs text-neutral-500">{item.section_name}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showSearchSkeleton ? (
                <TeacherRowsSkeleton count={4} />
              ) : filteredLessons.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching learning materials.</div>
              ) : (
                filteredLessons.map((lesson) => (
                  <Link key={lesson.id} href={`/dashboard/teacher/lessons/${lesson.id}`} className="block rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                    <div className="text-xs text-neutral-500">{lesson.subject_code ?? 'Material'}</div>
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
              {showSearchSkeleton ? (
                <TeacherRowsSkeleton count={4} />
              ) : filteredAssignments.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching assignments.</div>
              ) : (
                filteredAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/dashboard/teacher/assignments/${assignment.id}`}
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
              {showSearchSkeleton ? (
                <TeacherRowsSkeleton count={4} />
              ) : filteredQuizzes.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching quizzes.</div>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <Link key={quiz.id} href="/dashboard/teacher/quizzes" className="block rounded-xl border border-neutral-200 p-4">
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

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showSearchSkeleton ? (
                <TeacherRowsSkeleton count={4} />
              ) : filteredStudents.length === 0 ? (
                <div className="text-sm text-neutral-500">No matching students.</div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-semibold text-neutral-900">{student.user_name}</div>
                    <div className="text-xs text-neutral-500">{student.student_number ?? '—'}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

export default function TeacherSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <TeacherSearchPageInner />
    </Suspense>
  );
}
