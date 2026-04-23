'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { teacherNav } from '@/components/navigation/nav-config';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useTeacherStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useAttendanceSummary } from '@/features/attendance/hooks/useAttendanceSummary';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useChatContext } from '@/features/chat/hooks/useChatContext';
import { useQueries } from '@tanstack/react-query';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import {
  Users, ClipboardList, HelpCircle, Search, ChevronRight,
  TrendingUp, LayoutGrid, AlertCircle, BookOpen, User, CalendarDays,
} from 'lucide-react';

const ACCENT_COLORS = [
  { bg: '#0D1282', light: 'rgba(13,18,130,0.08)' },
  { bg: '#7c3aed', light: 'rgba(124,58,237,0.08)' },
  { bg: '#0891b2', light: 'rgba(8,145,178,0.08)' },
  { bg: '#059669', light: 'rgba(5,150,105,0.08)' },
  { bg: '#d97706', light: 'rgba(217,119,6,0.08)' },
  { bg: '#dc2626', light: 'rgba(220,38,38,0.08)' },
];

type StudentFilter = 'all' | 'needs_attention';

export default function TeacherDashboardPage() {
  const { data: students = [] } = useStudents();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const { data: attempts = [] } = useQuizAttempts();
  const { data: stats = [] } = useTeacherStats();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const { data: attendanceSummary = [] } = useAttendanceSummary();
  const { user } = useAuth();
  const { data: chatContext } = useChatContext();
  const { data: perfData } = useStudentPerformance();
  const [studentQuery, setStudentQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState<StudentFilter>('all');
  const [classQuery, setClassQuery] = useState('');
  const [classSectionFilter, setClassSectionFilter] = useState('');

  const perfSections = useMemo(() => perfData?.sections ?? [], [perfData]);

  const uniqueSections = useMemo(() => {
    const seen = new Set<string>();
    return perfSections
      .filter((s) => { if (seen.has(s.section_id)) return false; seen.add(s.section_id); return true; })
      .map((s) => ({ id: s.section_id, name: s.section_name }));
  }, [perfSections]);

  const studentIdsInSection = useMemo(() => {
    if (sectionFilter === 'all') return null;
    const section = perfSections.find((s) => s.section_id === sectionFilter);
    return new Set((section?.students ?? []).map((s) => s.student_id));
  }, [sectionFilter, perfSections]);

  const averageGrade = stats.find((s) => s.label === 'Average grade')?.value ?? '—';
  const pendingReviews = stats.find((s) => s.label === 'Pending reviews')?.value ?? '0';

  const isAdviser = user?.role === 'adviser' || chatContext?.role === 'adviser';
  const adviserSections = chatContext?.sections ?? [];

  const adviserSectionQueries = useQueries({
    queries: adviserSections.map((section) => ({
      queryKey: ['attendance', 'summary', { section: section.id }],
      queryFn: () => attendanceService.listSummary({ section: section.id }),
      enabled: Boolean(isAdviser),
    })),
  });

  const adviserAttendanceSummary = useMemo(() =>
    adviserSectionQueries.flatMap((q) => q.data ?? []),
    [adviserSectionQueries]
  );

  const allowedStudentIds = useMemo(() => {
    if (!isAdviser) return null;
    return new Set(adviserAttendanceSummary.map((i) => i.student_id));
  }, [adviserAttendanceSummary, isAdviser]);

  const assignmentByStudent = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    submissions.forEach((s) => {
      if (allowedStudentIds && !allowedStudentIds.has(s.student_id)) return;
      if (typeof s.score !== 'number') return;
      const e = map.get(s.student_id) ?? { sum: 0, count: 0 };
      e.sum += s.score; e.count += 1;
      map.set(s.student_id, e);
    });
    return map;
  }, [allowedStudentIds, submissions]);

  const quizByStudent = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    attempts.forEach((a) => {
      if (allowedStudentIds && !allowedStudentIds.has(a.student_id)) return;
      if (typeof a.score !== 'number') return;
      const e = map.get(a.student_id) ?? { sum: 0, count: 0 };
      e.sum += a.score; e.count += 1;
      map.set(a.student_id, e);
    });
    return map;
  }, [allowedStudentIds, attempts]);

  const attendanceByStudent = useMemo(() => {
    const map = new Map<string, { completion: number; total: number }>();
    attendanceSummary.forEach((s) => map.set(s.student_id, { completion: s.completion, total: s.total }));
    return map;
  }, [attendanceSummary]);

  // "Needs attention" = low assignment avg OR low quiz avg OR low attendance
  const needsAttentionIds = useMemo(() => {
    const ids = new Set<string>();
    students.forEach((s) => {
      const aStats = assignmentByStudent.get(s.id);
      const qStats = quizByStudent.get(s.id);
      const att = attendanceByStudent.get(s.id);
      const aAvg = aStats?.count ? aStats.sum / aStats.count : null;
      const qAvg = qStats?.count ? qStats.sum / qStats.count : null;
      const attPct = att?.completion ?? 0;
      if ((aAvg !== null && aAvg < 75) || (qAvg !== null && qAvg < 75) || attPct < 75) {
        ids.add(s.id);
      }
    });
    return ids;
  }, [students, assignmentByStudent, quizByStudent, attendanceByStudent]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    let base = students.filter((s) =>
      !q || [s.user_name, s.student_number].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
    if (isAdviser) {
      const ids = new Set(adviserAttendanceSummary.map((i) => i.student_id));
      base = base.filter((s) => ids.has(s.id));
    }
    if (studentIdsInSection) base = base.filter((s) => studentIdsInSection.has(s.id));
    if (studentFilter === 'needs_attention') base = base.filter((s) => needsAttentionIds.has(s.id));
    return base;
  }, [adviserAttendanceSummary, isAdviser, studentQuery, students, studentIdsInSection, studentFilter, needsAttentionIds]);

  // Class cards — sorted by schedule_time ascending
  const classSections = useMemo(() => {
    const parseTime = (t?: string) => {
      if (!t) return Infinity;
      const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return Infinity;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const p = match[3].toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const q = classQuery.trim().toLowerCase();
    return [...sectionSubjects]
      .filter((item) => {
        const matchesSection = !classSectionFilter || (item.section_name ?? '') === classSectionFilter;
        const matchesQuery = !q || [item.subject_name, item.section_name].filter(Boolean).join(' ').toLowerCase().includes(q);
        return matchesSection && matchesQuery;
      })
      .sort((a, b) => parseTime(a.schedule_time) - parseTime(b.schedule_time));
  }, [sectionSubjects, classQuery, classSectionFilter]);

  const classSections_unique = useMemo(() => {
    const names = new Set(sectionSubjects.map((s) => s.section_name ?? '').filter(Boolean));
    return Array.from(names).sort();
  }, [sectionSubjects]);

  const formatAvg = (sum: number, count: number) => count ? (sum / count).toFixed(1) : '—';

  return (
    <AppShell title="Teacher Dashboard" subtitle="Overview" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Overview</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">My Classes</h1>
              <p className="mt-2 text-sm text-white/70">
                Avg grade: {averageGrade} · {pendingReviews} pending reviews
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Classes',  value: sectionSubjects.length, icon: <LayoutGrid className="h-4 w-4" /> },
                { label: 'Students', value: students.length,         icon: <Users className="h-4 w-4" /> },
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

        {/* ── Search + filter for classes ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={classQuery}
              onChange={(e) => setClassQuery(e.target.value)}
              placeholder="Search subject or section…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>
          <select
            value={classSectionFilter}
            onChange={(e) => setClassSectionFilter(e.target.value)}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
          >
            <option value="">All Sections</option>
            {classSections_unique.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {classSections.length} class{classSections.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* ── Class Cards ── */}
        {classSections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <LayoutGrid className="h-8 w-8 opacity-30" />
            <p className="text-sm">No classes found.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {classSections.map((item, i) => {
              const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <motion.div key={item.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <Link href={`/dashboard/teacher/classes/${item.id}`} className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="h-1.5 w-full" style={{ background: accent.bg }} />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                          style={{ background: accent.light, color: accent.bg }}>
                          {item.section_name ?? 'N/A'}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                          {item.term_label ?? '—'}
                        </span>
                      </div>
                      <h2 className="mb-1 text-lg font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {item.subject_name}
                      </h2>
                      <div className="mb-4 flex-1 space-y-1.5">
                        {item.schedule_days && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: accent.bg }} />
                            {item.schedule_days}
                          </div>
                        )}
                        {item.schedule_time && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <ClipboardList className="h-3.5 w-3.5 shrink-0" style={{ color: accent.bg }} />
                            {item.schedule_time}
                          </div>
                        )}
                        {!item.schedule_days && !item.schedule_time && (
                          <div className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>No schedule set</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: accent.light }}>
                            <User className="h-3.5 w-3.5" style={{ color: accent.bg }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            {item.teacher_name ?? 'TBA'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent.bg }}>
                          Open <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Students at a Glance ── */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Students at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* Needs Attention filter */}
              <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
                {([
                  { value: 'all', label: 'All' },
                  { value: 'needs_attention', label: 'Needs Attention', icon: <AlertCircle className="h-3.5 w-3.5" /> },
                ] as { value: StudentFilter; label: string; icon?: React.ReactNode }[]).map((f) => (
                  <button key={f.value} onClick={() => setStudentFilter(f.value)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={studentFilter === f.value
                      ? { background: f.value === 'needs_attention' ? '#dc2626' : 'var(--brand-blue-deep)', color: '#fff' }
                      : { color: 'var(--muted-foreground)' }}>
                    {f.icon}{f.label}
                    {f.value === 'needs_attention' && (
                      <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: studentFilter === 'needs_attention' ? 'rgba(255,255,255,0.25)' : 'rgba(220,38,38,0.1)', color: studentFilter === 'needs_attention' ? '#fff' : '#dc2626' }}>
                        {needsAttentionIds.size}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {uniqueSections.length > 0 && (
                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}
                  className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:outline-none">
                  <option value="all">All Sections</option>
                  {uniqueSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}

              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search student…"
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-4 text-sm text-neutral-700 outline-none" />
              </div>
              <span className="ml-auto text-xs text-neutral-400">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {studentFilter === 'needs_attention' && filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                🎉 No students need attention right now!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      <th className="pb-3 text-left">Name</th>
                      <th className="pb-3 text-left">Student No.</th>
                      <th className="pb-3 text-left">Assignments</th>
                      <th className="pb-3 text-left">Quizzes</th>
                      <th className="pb-3 text-left">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredStudents.map((student) => {
                      const aStats = assignmentByStudent.get(student.id) ?? { sum: 0, count: 0 };
                      const qStats = quizByStudent.get(student.id) ?? { sum: 0, count: 0 };
                      const att = attendanceByStudent.get(student.id);
                      const needsAttention = needsAttentionIds.has(student.id);
                      return (
                        <tr key={student.id} className="transition-colors hover:bg-neutral-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {needsAttention && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
                              <span className="font-medium text-neutral-900">{student.user_name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-neutral-400">{student.student_number ?? '—'}</td>
                          <td className="py-3 pr-4">
                            <span className={`font-semibold ${aStats.count && aStats.sum / aStats.count < 75 ? 'text-rose-600' : 'text-neutral-900'}`}>
                              {formatAvg(aStats.sum, aStats.count)}
                            </span>
                            <span className="ml-1 text-xs text-neutral-400">{aStats.count} graded</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`font-semibold ${qStats.count && qStats.sum / qStats.count < 75 ? 'text-rose-600' : 'text-neutral-900'}`}>
                              {formatAvg(qStats.sum, qStats.count)}
                            </span>
                            <span className="ml-1 text-xs text-neutral-400">{qStats.count} graded</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${(att?.completion ?? 0) < 75 ? 'text-rose-600' : 'text-neutral-900'}`}>
                                {att?.completion ?? 0}%
                              </span>
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                                <div className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, att?.completion ?? 0)}%`, background: (att?.completion ?? 0) < 75 ? '#dc2626' : 'var(--brand-blue)' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
