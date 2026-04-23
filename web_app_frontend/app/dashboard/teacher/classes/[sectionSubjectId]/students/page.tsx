'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import type { StudentPerformanceStudent } from '@/features/dashboard/types';

// ── helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name: string) {
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const idx = name.charCodeAt(0) % palette.length;
  return palette[idx];
}

function riskLevel(student: StudentPerformanceStudent): 'high' | 'medium' | 'low' {
  const missing = (student.assignments?.missing ?? 0) + (student.quizzes?.missing ?? 0);
  const violations = student.violations ?? 0;
  if (violations > 0 || missing >= 3) return 'high';
  if (missing >= 1) return 'medium';
  return 'low';
}

const riskConfig = {
  high:   { label: 'At Risk',  className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  medium: { label: 'Watch',    className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  low:    { label: 'On Track', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function ScorePill({ value, total }: { value: number | null | undefined; total: number }) {
  if (value == null || total === 0) return <span className="text-neutral-400">—</span>;
  const pct = Math.round((value / total) * 100);
  const color = pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-rose-700';
  return <span className={`font-semibold ${color}`}>{value}<span className="text-neutral-400 font-normal">/{total}</span></span>;
}

function MiniBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-neutral-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

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
    if (genderFilter !== 'all') list = list.filter((s) => s.gender === genderFilter);
    if (normalizedQuery) {
      list = list.filter((s) =>
        [s.student_name, s.student_number].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery)
      );
    }
    return list.slice().sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [students, normalizedQuery, genderFilter]);

  const summary = useMemo(() => {
    const total = students.length;
    const atRisk = students.filter((s) => riskLevel(s) === 'high').length;
    const missingWork = students.reduce(
      (sum, s) => sum + (s.assignments?.missing ?? 0) + (s.quizzes?.missing ?? 0), 0
    );
    const violations = students.reduce((sum, s) => sum + (s.violations ?? 0), 0);
    const avgAttendance = total > 0
      ? Math.round(students.reduce((sum, s) => {
          const t = s.attendance.total || 1;
          return sum + (s.attendance.present / t) * 100;
        }, 0) / total)
      : 0;
    return { total, atRisk, missingWork, violations, avgAttendance };
  }, [students]);

  const statCards = [
    {
      label: 'Total Students',
      value: summary.total,
      icon: '👥',
      accent: 'from-blue-50 to-white border-blue-100',
      valueClass: 'text-[var(--brand-blue-deep)]',
    },
    {
      label: 'Missing Work',
      value: summary.missingWork,
      icon: '📋',
      accent: 'from-amber-50 to-white border-amber-100',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Violations',
      value: summary.violations,
      icon: '🚨',
      accent: 'from-rose-50 to-white border-rose-100',
      valueClass: 'text-rose-700',
    },
    {
      label: 'Avg Attendance',
      value: `${summary.avgAttendance}%`,
      icon: '📅',
      accent: 'from-emerald-50 to-white border-emerald-100',
      valueClass: 'text-emerald-700',
    },
  ];

  return (
    <AppShell title="Teacher Dashboard" subtitle="Subject students" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">

        {/* breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Link href="/dashboard/teacher/classes" className="font-medium text-[var(--brand-blue-deep)] hover:underline">
            My Classes
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href={`/dashboard/teacher/classes/${sectionSubjectId}`} className="font-medium text-[var(--brand-blue-deep)] hover:underline">
            {subject?.subject_name ?? 'Subject'}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-medium text-neutral-700">Students</span>
        </nav>

        <PageHeader
          title={subject?.subject_name ?? 'Subject Students'}
          description={subject ? `${subject.section_name}${subject.term_label ? ` · ${subject.term_label}` : ''}` : 'Review student progress for this subject.'}
          actions={
            <Button variant="secondary" as={Link} href={`/dashboard/teacher/classes/${sectionSubjectId}`}>
              ← Back to class
            </Button>
          }
        />

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border bg-gradient-to-br ${card.accent} p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{card.label}</span>
                <span className="text-base">{card.icon}</span>
              </div>
              <div className={`mt-2 text-2xl font-bold ${card.valueClass}`}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name or ID…"
            className="h-9 w-56 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue-muted)]"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
          >
            <option value="all">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <span className="ml-auto text-xs text-neutral-400">{visibleStudents.length} student{visibleStudents.length !== 1 ? 's' : ''}</span>
        </div>

        {/* student list */}
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
            Loading students…
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
            No students match your filters.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleStudents.map((student) => {
              const risk = riskLevel(student);
              const rc = riskConfig[risk];
              const attendancePct = student.attendance.total > 0
                ? Math.round((student.attendance.present / student.attendance.total) * 100)
                : 0;

              return (
                <Card key={student.student_id} className="overflow-hidden border border-neutral-200/80 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-0">
                    {/* top strip */}
                    <div className="flex items-center gap-4 border-b border-neutral-100 px-5 py-4">
                      {/* avatar */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(student.student_name)}`}>
                        {initials(student.student_name)}
                      </div>

                      {/* name + id */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-neutral-900">{student.student_name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rc.className}`}>
                            {rc.label}
                          </span>
                          {(student.violations ?? 0) > 0 && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                              🚨 {student.violations} violation{(student.violations ?? 0) > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-400">
                          {student.student_number ? `ID · ${student.student_number}` : 'No student ID'}
                          {student.gender ? ` · ${student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}` : ''}
                        </div>
                      </div>

                      {/* attendance pill */}
                      <div className="hidden shrink-0 text-right sm:block">
                        <div className="text-[10px] uppercase tracking-widest text-neutral-400">Attendance</div>
                        <div className={`mt-0.5 text-sm font-bold ${attendancePct >= 75 ? 'text-emerald-700' : attendancePct >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {attendancePct}%
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {student.attendance.present}P · {student.attendance.absent}A · {student.attendance.late}L
                        </div>
                      </div>
                    </div>

                    {/* stats grid */}
                    <div className="grid grid-cols-1 divide-y divide-neutral-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                      {/* assignments */}
                      <div className="px-5 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Assignments</span>
                          <ScorePill
                            value={student.assignments?.submitted}
                            total={student.assignments?.total ?? 0}
                          />
                        </div>
                        <MiniBar
                          value={student.assignments?.submitted ?? 0}
                          total={student.assignments?.total ?? 1}
                          color="bg-[var(--brand-blue-deep)]"
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Avg score</span>
                          <span className="font-medium text-neutral-700">
                            {student.assignments?.average_score != null
                              ? `${student.assignments.average_score}%`
                              : '—'}
                          </span>
                        </div>
                        {(student.assignments?.missing ?? 0) > 0 && (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            {student.assignments?.missing} missing
                          </div>
                        )}
                      </div>

                      {/* quizzes */}
                      <div className="px-5 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Quizzes</span>
                          <ScorePill
                            value={student.quizzes?.attempted}
                            total={student.quizzes?.total ?? 0}
                          />
                        </div>
                        <MiniBar
                          value={student.quizzes?.attempted ?? 0}
                          total={student.quizzes?.total ?? 1}
                          color="bg-violet-500"
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Avg score</span>
                          <span className="font-medium text-neutral-700">
                            {student.quizzes?.average_score != null
                              ? `${student.quizzes.average_score}%`
                              : '—'}
                          </span>
                        </div>
                        {(student.quizzes?.missing ?? 0) > 0 && (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            {student.quizzes?.missing} missing
                          </div>
                        )}
                      </div>

                      {/* attendance */}
                      <div className="px-5 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Attendance</span>
                          <span className={`text-sm font-semibold ${attendancePct >= 75 ? 'text-emerald-700' : attendancePct >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                            {attendancePct}%
                          </span>
                        </div>
                        <MiniBar
                          value={student.attendance.present}
                          total={student.attendance.total || 1}
                          color={attendancePct >= 75 ? 'bg-emerald-500' : attendancePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}
                        />
                        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                          {[
                            { label: 'Present', value: student.attendance.present, color: 'text-emerald-700' },
                            { label: 'Absent',  value: student.attendance.absent,  color: 'text-rose-700' },
                            { label: 'Late',    value: student.attendance.late,    color: 'text-amber-700' },
                            { label: 'Excused', value: student.attendance.excused, color: 'text-blue-700' },
                          ].map((a) => (
                            <div key={a.label} className="rounded-lg bg-neutral-50 py-1">
                              <div className={`font-bold ${a.color}`}>{a.value}</div>
                              <div className="text-neutral-400">{a.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
