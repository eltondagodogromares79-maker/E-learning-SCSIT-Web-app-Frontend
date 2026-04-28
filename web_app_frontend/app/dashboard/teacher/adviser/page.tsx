'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { TeacherCardGridSkeleton } from '@/components/layout/TeacherListSkeletons';
import { teacherNav } from '@/components/navigation/nav-config';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';
import { Search, Users, ShieldAlert, BookOpen, ChevronRight, School, AlertTriangle } from 'lucide-react';

export default function AdviserDashboardPage() {
  const { data, isLoading } = useStudentPerformance();
  const { user } = useAuth();
  const isAdviser = user?.role === 'adviser';
  const sections = data?.mode === 'adviser' ? data.sections : [];

  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [riskOnly, setRiskOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const showListSkeleton = useReliableSkeleton(isLoading);

  const filteredSections = useMemo(() =>
    sectionFilter === 'all' ? sections : sections.filter((s) => s.section_id === sectionFilter),
    [sections, sectionFilter]
  );

  const q = query.trim().toLowerCase();
  const withQuery = useMemo(() =>
    !q ? filteredSections : filteredSections
      .map((s) => ({ ...s, students: s.students.filter((st) => [st.student_name, st.student_number].filter(Boolean).join(' ').toLowerCase().includes(q)) }))
      .filter((s) => s.students.length > 0),
    [filteredSections, q]
  );

  const sorted = useMemo(() => {
    let result = withQuery;
    if (genderFilter !== 'all') result = result.map((s) => ({ ...s, students: s.students.filter((st) => st.gender === genderFilter) })).filter((s) => s.students.length > 0);
    if (riskOnly) result = result.map((s) => ({
      ...s,
      students: s.students.filter((st) => {
        const missing = st.subjects?.reduce((sum, sub) => sum + (sub.missing_assignments ?? 0) + (sub.missing_quizzes ?? 0), 0) ?? 0;
        const violations = st.subjects?.reduce((sum, sub) => sum + (sub.violations ?? 0), 0) ?? 0;
        return missing > 0 || violations > 0;
      }),
    })).filter((s) => s.students.length > 0);
    return result.map((s) => ({ ...s, students: s.students.slice().sort((a, b) => a.student_name.localeCompare(b.student_name)) }));
  }, [withQuery, riskOnly, genderFilter]);

  const summary = useMemo(() => {
    const all = sections.flatMap((s) => s.students);
    return {
      totalStudents: all.length,
      totalViolations: all.reduce((sum, st) => sum + (st.subjects?.reduce((s2, sub) => s2 + (sub.violations ?? 0), 0) ?? 0), 0),
      atRisk: all.filter((st) => {
        const missing = st.subjects?.reduce((s2, sub) => s2 + (sub.missing_assignments ?? 0) + (sub.missing_quizzes ?? 0), 0) ?? 0;
        const v = st.subjects?.reduce((s2, sub) => s2 + (sub.violations ?? 0), 0) ?? 0;
        return missing > 0 || v > 0;
      }).length,
    };
  }, [sections]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Adviser" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <School className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Adviser</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">My Section</h1>
              <p className="mt-2 text-sm text-white/70">Monitor student performance and at-risk flags.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Sections',   value: sections.length,          icon: <School className="h-4 w-4" /> },
                { label: 'Students',   value: summary.totalStudents,     icon: <Users className="h-4 w-4" /> },
                { label: 'At Risk',    value: summary.atRisk,            icon: <AlertTriangle className="h-4 w-4" /> },
                { label: 'Violations', value: summary.totalViolations,   icon: <ShieldAlert className="h-4 w-4" /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-white/60">{s.icon}</span>
                  <div>
                    <div className="text-lg font-bold leading-none text-white">{s.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!isAdviser ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <School className="h-8 w-8 opacity-30" />
            <p className="text-sm">You are not assigned as an adviser yet.</p>
          </div>
        ) : (
          <>
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student…"
                  className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
              </div>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
                className="h-10 rounded-xl border px-3 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}>
                <option value="all">All sections</option>
                {sections.map((s) => <option key={s.section_id} value={s.section_id}>{s.section_name}</option>)}
              </select>
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
                className="h-10 rounded-xl border px-3 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}>
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <button onClick={() => setRiskOnly((p) => !p)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
                style={riskOnly
                  ? { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }
                  : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {riskOnly ? '⚠ At-risk only' : 'Show at-risk only'}
              </button>
            </div>

            {/* ── Student cards ── */}
            {showListSkeleton ? (
              <TeacherCardGridSkeleton />
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-sm">No students found.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sorted.map((section) => (
                  <div key={section.section_id}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{section.section_name}</span>
                      <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {section.students.map((student) => {
                        const missing = student.subjects?.reduce((sum, sub) => sum + (sub.missing_assignments ?? 0) + (sub.missing_quizzes ?? 0), 0) ?? 0;
                        const violations = student.subjects?.reduce((sum, sub) => sum + (sub.violations ?? 0), 0) ?? 0;
                        const isAtRisk = missing > 0 || violations > 0;
                        return (
                          <motion.div key={student.student_id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                            <div className="flex flex-col overflow-hidden rounded-2xl border"
                              style={{ borderColor: isAtRisk ? '#fca5a5' : 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                              <div className="h-1.5 w-full" style={{ background: isAtRisk ? '#dc2626' : '#0891b2' }} />
                              <div className="flex flex-1 flex-col p-5">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{student.student_name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{student.student_number ? `ID ${student.student_number}` : 'Student'}</p>
                                  </div>
                                  {isAtRisk && (
                                    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                      <AlertTriangle className="h-3 w-3" /> At Risk
                                    </span>
                                  )}
                                </div>
                                <div className="mb-4 flex flex-wrap gap-2">
                                  <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                    style={{ background: 'var(--surface-2)', color: 'var(--muted-foreground)' }}>
                                    <BookOpen className="h-3 w-3" /> {student.subjects?.length ?? 0} subjects
                                  </span>
                                  {missing > 0 && (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: '#fef3c7', color: '#d97706' }}>
                                      {missing} missing
                                    </span>
                                  )}
                                  {violations > 0 && (
                                    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                      <ShieldAlert className="h-3 w-3" /> {violations} violation{violations !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <Link href={`/dashboard/teacher/adviser/students/${student.student_id}`}
                                  className="mt-auto flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
                                  style={{ background: 'var(--brand-blue)', color: '#fff' }}>
                                  View Record <ChevronRight className="h-4 w-4" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
