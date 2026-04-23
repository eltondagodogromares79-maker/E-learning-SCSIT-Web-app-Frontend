'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { Search, ClipboardList, Clock, CheckCircle, AlertCircle, ChevronRight, Calendar, Star } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'submitted' | 'graded' | 'late';
type SortOrder = 'newest' | 'oldest';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded',    label: 'Graded' },
  { value: 'late',      label: 'Late / Overdue' },
];

function getStatus(assignmentId: string, dueDate: string, submissionLookup: Record<string, any>) {
  const submission = submissionLookup[assignmentId];
  const due = new Date(dueDate);
  if (submission) {
    if (submission.graded_at || typeof submission.score === 'number')
      return { label: 'Graded', filter: 'graded' as StatusFilter, color: '#059669', light: 'rgba(5,150,105,0.1)', variant: 'success' as const };
    const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
    if (submittedAt && !Number.isNaN(submittedAt.getTime()) && submittedAt > due)
      return { label: 'Late', filter: 'late' as StatusFilter, color: '#dc2626', light: 'rgba(220,38,38,0.1)', variant: 'destructive' as const };
    return { label: 'Submitted', filter: 'submitted' as StatusFilter, color: '#d97706', light: 'rgba(217,119,6,0.1)', variant: 'muted' as const };
  }
  if (!Number.isNaN(due.getTime()) && due < new Date())
    return { label: 'Overdue', filter: 'late' as StatusFilter, color: '#dc2626', light: 'rgba(220,38,38,0.1)', variant: 'destructive' as const };
  return { label: 'Pending', filter: 'pending' as StatusFilter, color: '#0891b2', light: 'rgba(8,145,178,0.1)', variant: 'outline' as const };
}

export default function StudentAssignmentsPage() {
  const { data: assignments = [] } = useAssignments();
  const { data: subjects = [] } = useSubjects();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const subjectLookup = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const submissionLookup = Object.fromEntries(submissions.map((s) => [s.assignment_id, s]));
  const [sectionFilter, setSectionFilter] = useState('');

  const sections = useMemo(() => {
    const names = new Set(assignments.map((a) => a.subject_name ?? subjectLookup[a.subject_id] ?? '').filter(Boolean));
    return Array.from(names).sort();
  }, [assignments, subjectLookup]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...assignments]
      .filter((a) => {
        const status = getStatus(a.id, a.due_date, submissionLookup);
        const matchesStatus = statusFilter === 'all' || status.filter === statusFilter;
        const subjectName = a.subject_name ?? subjectLookup[a.subject_id] ?? '';
        const matchesSection = !sectionFilter || subjectName === sectionFilter;
        if (!q) return matchesStatus && matchesSection;
        const haystack = [a.title, subjectName].join(' ').toLowerCase();
        return matchesStatus && matchesSection && haystack.includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [assignments, query, sortOrder, statusFilter, submissionLookup, subjectLookup]);

  const counts = useMemo(() => {
    const c = { pending: 0, submitted: 0, graded: 0, late: 0 };
    assignments.forEach((a) => {
      const s = getStatus(a.id, a.due_date, submissionLookup);
      if (s.filter === 'pending') c.pending++;
      else if (s.filter === 'submitted') c.submitted++;
      else if (s.filter === 'graded') c.graded++;
      else if (s.filter === 'late') c.late++;
    });
    return c;
  }, [assignments, submissionLookup]);

  return (
    <AppShell title="Student Dashboard" subtitle="Assignments" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Assignments</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Assignments</h1>
              <p className="mt-2 text-sm text-white/70">{assignments.length} total assignment{assignments.length !== 1 ? 's' : ''}</p>
            </div>
            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Pending',   value: counts.pending,   icon: <Clock className="h-4 w-4" /> },
                { label: 'Submitted', value: counts.submitted, icon: <CheckCircle className="h-4 w-4" /> },
                { label: 'Graded',    value: counts.graded,    icon: <Star className="h-4 w-4" /> },
                { label: 'Late',      value: counts.late,      icon: <AlertCircle className="h-4 w-4" /> },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-white/60">{stat.icon}</span>
                  <div>
                    <div className="text-lg font-bold text-white leading-none">{stat.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Search + filters ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assignments…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                style={statusFilter === f.value
                  ? { background: 'var(--brand-blue)', color: '#fff', borderColor: 'var(--brand-blue)' }
                  : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                {f.label}
              </button>
            ))}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="newest">Newest uploaded</option>
              <option value="oldest">Oldest uploaded</option>
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
              style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <option value="">All Subjects</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Cards ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <ClipboardList className="h-8 w-8 opacity-30" />
            <p className="text-sm">No assignments found.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((assignment) => {
              const status = getStatus(assignment.id, assignment.due_date, submissionLookup);
              const submission = submissionLookup[assignment.id];
              const subjectName = assignment.subject_name ?? subjectLookup[assignment.subject_id] ?? 'General';
              const due = new Date(assignment.due_date);

              return (
                <motion.div key={assignment.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <Link href={`/dashboard/student/assignments/${assignment.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    {/* Status bar */}
                    <div className="h-1.5 w-full" style={{ background: status.color }} />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Subject + status badge */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                          {subjectName}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: status.light, color: status.color }}>
                          {status.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-4 flex-1 text-base font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {assignment.title}
                      </h3>

                      {/* Meta row */}
                      <div className="mb-4 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Calendar className="h-3.5 w-3.5" />
                          Due {due.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Star className="h-3.5 w-3.5" />
                          {assignment.total_points} pts
                        </div>
                      </div>

                      {/* Answer preview */}
                      {submission?.submission_text && (
                        <div className="mb-4 rounded-xl border px-3 py-2.5 text-xs"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--muted-foreground)' }}>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Your answer</p>
                          {submission.submission_text.slice(0, 100)}{submission.submission_text.length > 100 ? '…' : ''}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {submission?.submitted_at
                            ? `Submitted ${new Date(submission.submitted_at).toLocaleDateString()}`
                            : 'Not submitted yet'}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: status.color }}>
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
      </div>
    </AppShell>
  );
}
