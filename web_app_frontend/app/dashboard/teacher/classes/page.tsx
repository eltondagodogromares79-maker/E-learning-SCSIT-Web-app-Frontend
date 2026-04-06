'use client';

import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import Link from 'next/link';

export default function TeacherClassesPage() {
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const sections = useMemo(() => {
    const unique = new Set(sectionSubjects.map((item) => item.section_name || 'Unassigned'));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [sectionSubjects]);
  const [selectedSection, setSelectedSection] = useState('');
  const filteredSubjects = useMemo(() => {
    if (!selectedSection) return sectionSubjects;
    return sectionSubjects.filter((item) => (item.section_name || 'Unassigned') === selectedSection);
  }, [sectionSubjects, selectedSection]);
  const groupedBySection = filteredSubjects.reduce<Record<string, typeof sectionSubjects>>((acc, item) => {
    const key = item.section_name || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const sectionEntries = Object.entries(groupedBySection).sort(([a], [b]) => a.localeCompare(b));

  return (
    <AppShell title="Teacher Dashboard" subtitle="My Classes" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="My classes"
          description="Manage each section subject and jump directly into creating lessons, assignments, and quizzes."
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Filter by section</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Section</label>
            <select
              className="h-10 rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Assigned section subjects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sectionEntries.map(([sectionName, items]) => (
              <div key={sectionName} className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Section</div>
                <div className="mt-1 text-base font-semibold text-neutral-900">{sectionName}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-neutral-200 p-4">
                      <Link
                        href={`/dashboard/teacher/classes/${item.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:underline"
                      >
                        {item.subject_name}
                      </Link>
                      <div className="text-xs text-neutral-500">
                        {item.term_label ? `Term: ${item.term_label}` : 'Term not set'}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/teacher/classes/${item.id}/students`}
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100/60"
                        >
                          View students
                        </Link>
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
                </div>
              </div>
            ))}
            {sectionSubjects.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                No classes assigned yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
