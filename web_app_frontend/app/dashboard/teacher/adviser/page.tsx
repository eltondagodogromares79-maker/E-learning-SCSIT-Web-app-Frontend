'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { teacherNav } from '@/components/navigation/nav-config';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';

export default function AdviserDashboardPage() {
  const { data, isLoading } = useStudentPerformance();
  const { user } = useAuth();
  const isAdviser = user?.role === 'adviser';
  const sections = data?.mode === 'adviser' ? data.sections : [];
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [riskOnly, setRiskOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredSections = useMemo(() => {
    if (sectionFilter === 'all') return sections;
    return sections.filter((section) => section.section_id === sectionFilter);
  }, [sections, sectionFilter]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    if (!normalizedQuery) return filteredSections;
    return filteredSections
      .map((section) => ({
        ...section,
        students: section.students.filter((student) =>
          [student.student_name, student.student_number].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((section) => section.students.length > 0);
  }, [filteredSections, normalizedQuery]);

  const riskFilteredSections = useMemo(() => {
    let result = filteredStudents;
    if (genderFilter !== 'all') {
      result = result
        .map((section) => ({
          ...section,
          students: section.students.filter((student) => student.gender === genderFilter),
        }))
        .filter((section) => section.students.length > 0);
    }
    if (!riskOnly) return result;
    return result
      .map((section) => ({
        ...section,
        students: section.students.filter((student) => {
          const missing =
            student.subjects?.reduce(
              (sum, subject) => sum + (subject.missing_assignments ?? 0) + (subject.missing_quizzes ?? 0),
              0
            ) ?? 0;
          const violations = student.subjects?.reduce((sum, subject) => sum + (subject.violations ?? 0), 0) ?? 0;
          return missing > 0 || violations > 0;
        }),
      }))
      .filter((section) => section.students.length > 0);
  }, [filteredStudents, riskOnly, genderFilter]);

  const sortedSections = useMemo(() => {
    return riskFilteredSections.map((section) => ({
      ...section,
      students: section.students.slice().sort((a, b) => a.student_name.localeCompare(b.student_name)),
    }));
  }, [riskFilteredSections]);

  const summary = useMemo(() => {
    const allStudents = sections.flatMap((section) => section.students);
    const totalStudents = allStudents.length;
    const totalViolations = allStudents.reduce((sum, student) => {
      const subjectViolations = student.subjects?.reduce((inner, subject) => inner + (subject.violations ?? 0), 0) ?? 0;
      return sum + subjectViolations;
    }, 0);
    return { totalStudents, totalViolations };
  }, [sections]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Adviser" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="My section"
          description="Monitor your advised sections, student performance, and subject-level progress."
        />

        {!isAdviser ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
            You are not assigned as an adviser yet.
          </div>
        ) : (
          <>
            <Card className="border border-[rgba(30,79,214,0.12)] bg-gradient-to-br from-white via-white to-blue-50/60">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Overview</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-10 rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={sectionFilter}
                    onChange={(event) => setSectionFilter(event.target.value)}
                  >
                    <option value="all">All adviser sections</option>
                    {sections.map((section) => (
                      <option key={section.section_id} value={section.section_id}>
                        {section.section_name}
                      </option>
                    ))}
                  </select>
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
                  <button
                    type="button"
                    onClick={() => setRiskOnly((prev) => !prev)}
                    className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      riskOnly
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-[rgba(15,23,42,0.12)] text-neutral-600 hover:bg-[rgba(15,23,42,0.05)]'
                    }`}
                  >
                    {riskOnly ? 'At-risk only' : 'Show at-risk only'}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Sections', value: sections.length, accent: 'text-slate-700' },
                  { label: 'Students', value: summary.totalStudents, accent: 'text-slate-700' },
                  { label: 'Violations', value: summary.totalViolations, accent: 'text-rose-700' },
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
                Loading adviser records…
              </div>
            ) : sortedSections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No students found.
              </div>
            ) : (
              <div className="space-y-6">
                {sortedSections.map((section) => (
                  <Card key={section.section_id} className="border border-[rgba(17,17,17,0.12)] bg-white/90">
                    <CardHeader>
                      <CardTitle>{section.section_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.students.map((student, index) => (
                        <div
                          key={student.student_id}
                          className={`rounded-2xl border border-neutral-200/70 p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.45)] ${
                            index % 2 === 0 ? 'bg-white/95' : 'bg-blue-50/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">{student.student_name}</div>
                              <div className="text-xs text-neutral-500">
                                {student.student_number ? `ID ${student.student_number}` : 'Student record'}
                              </div>
                            </div>
                            <div className="text-right text-xs text-neutral-600">
                              <Badge variant="outline">
                                Missing{' '}
                                {student.subjects?.reduce(
                                  (sum, subject) => sum + (subject.missing_assignments ?? 0) + (subject.missing_quizzes ?? 0),
                                  0
                                ) ?? 0}
                              </Badge>
                              <Badge className="mt-2 border border-rose-200 bg-rose-50 text-rose-700">
                                Violations {student.subjects?.reduce((sum, subject) => sum + (subject.violations ?? 0), 0) ?? 0}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">Subjects {student.subjects?.length ?? 0}</Badge>
                            <Badge variant="outline">
                              Violations {student.subjects?.reduce((sum, subject) => sum + (subject.violations ?? 0), 0) ?? 0}
                            </Badge>
                            <Link
                              href={`/dashboard/teacher/adviser/students/${student.student_id}`}
                              className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                            >
                              View student record
                            </Link>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
