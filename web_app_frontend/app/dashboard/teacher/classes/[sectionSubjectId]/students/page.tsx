'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import Link from 'next/link';

export default function TeacherSubjectStudentsPage() {
  const params = useParams();
  const sectionSubjectId = params.sectionSubjectId as string;
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const { data, isLoading } = useStudentPerformance();
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const subject = sectionSubjects.find((item) => item.id === sectionSubjectId);
  const section = data?.sections.find((item) => item.section_subject_id === sectionSubjectId);
  const students = section?.students ?? [];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleStudents = useMemo(() => {
    let list = students;
    if (genderFilter !== 'all') {
      list = list.filter((student) => student.gender === genderFilter);
    }
    if (normalizedQuery) {
      list = list.filter((student) =>
        [student.student_name, student.student_number].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
      );
    }
    return list.slice().sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [students, normalizedQuery, genderFilter]);

  const summary = useMemo(() => {
    const total = students.length;
    const missingAssignments = students.reduce((sum, student) => sum + (student.assignments?.missing ?? 0), 0);
    const missingQuizzes = students.reduce((sum, student) => sum + (student.quizzes?.missing ?? 0), 0);
    const violations = students.reduce((sum, student) => sum + (student.violations ?? 0), 0);
    return { total, missingAssignments, missingQuizzes, violations };
  }, [students]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Subject students" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <div className="text-xs text-neutral-500">
          <Link href="/dashboard/teacher/classes" className="font-semibold text-[var(--brand-blue-deep)] hover:underline">
            My Classes
          </Link>
          <span className="mx-2 text-neutral-400">→</span>
          <Link
            href={`/dashboard/teacher/classes/${sectionSubjectId}`}
            className="font-semibold text-[var(--brand-blue-deep)] hover:underline"
          >
            {subject?.subject_name ?? 'Subject'}
          </Link>
          <span className="mx-2 text-neutral-400">→</span>
          <span className="font-semibold text-neutral-700">Students</span>
        </div>
        <PageHeader
          title={subject ? `${subject.subject_name}` : 'Subject students'}
          description={subject ? `${subject.section_name}${subject.term_label ? ` · ${subject.term_label}` : ''}` : 'Review student progress for this subject.'}
          actions={
            <Button variant="secondary" as={Link} href={`/dashboard/teacher/classes/${sectionSubjectId}`}>
              Back to class details
            </Button>
          }
        />

        <Card className="border border-[rgba(30,79,214,0.12)] bg-gradient-to-br from-white via-white to-blue-50/60">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Summary</CardTitle>
            <Input
              placeholder="Search student"
              className="md:w-64"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="h-10 rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value as 'all' | 'male' | 'female')}
            >
              <option value="all">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Students', value: summary.total, accent: 'text-slate-700' },
              { label: 'Missing assignments', value: summary.missingAssignments, accent: 'text-rose-700' },
              { label: 'Missing quizzes', value: summary.missingQuizzes, accent: 'text-amber-700' },
              { label: 'Violations', value: summary.violations, accent: 'text-rose-700' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-neutral-200/70 bg-white/90 p-3 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.45)]"
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{item.label}</div>
                <div className={`mt-1 text-2xl font-semibold ${item.accent}`}>{item.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            Loading students…
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            No students found.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleStudents.map((student, index) => (
              <Card
                key={student.student_id}
                className={`border border-neutral-200/70 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.45)] ${
                  index % 2 === 0 ? 'bg-white/95' : 'bg-blue-50/40'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{student.student_name}</div>
                      <div className="text-xs text-neutral-500">
                        {student.student_number ? `ID ${student.student_number}` : 'Student record'}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                          Missing assignments: {student.assignments?.missing ?? 0}
                        </span>
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                          Missing quizzes: {student.quizzes?.missing ?? 0}
                        </span>
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
                          Violations: {student.violations ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-neutral-600">
                      <div>Attendance</div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        {student.attendance.present} present · {student.attendance.absent} absent
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Assignments</div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        Avg {student.assignments?.average_score ?? '—'}
                      </div>
                      <div className="mt-1">Submitted {student.assignments?.submitted ?? 0} / {student.assignments?.total ?? 0}</div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Quizzes</div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        Avg {student.quizzes?.average_score ?? '—'}
                      </div>
                      <div className="mt-1">Attempted {student.quizzes?.attempted ?? 0} / {student.quizzes?.total ?? 0}</div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Attendance</div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        {student.attendance.present} present
                      </div>
                      <div className="mt-1">{student.attendance.late} late · {student.attendance.excused} excused</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
