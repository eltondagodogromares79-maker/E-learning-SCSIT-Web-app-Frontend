'use client';

import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useStudentTranscript } from '@/features/students/hooks/useStudentTranscript';
import { GraduationCap, BookOpen, User, CalendarDays, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function StudentTranscriptPage() {
  const { data: enrollments = [], isLoading } = useStudentTranscript();
  const current = enrollments.find((e) => e.is_current);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <AppShell title="Student Dashboard" subtitle="My Records" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Academic Record</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">My Records</h1>
              <p className="mt-2 text-sm text-white/70">{enrollments.length} enrollment record{enrollments.length !== 1 ? 's' : ''}</p>
            </div>
            {current && (
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { label: 'Year Level', value: current.year_level_name ?? '—', icon: <Layers className="h-4 w-4" /> },
                  { label: 'Section',    value: current.section_name ?? '—',    icon: <User className="h-4 w-4" /> },
                  { label: 'Term',       value: current.term_label ?? '—',      icon: <CalendarDays className="h-4 w-4" /> },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                    <span className="text-white/60">{s.icon}</span>
                    <div>
                      <div className="text-sm font-bold leading-none text-white">{s.value}</div>
                      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">{s.label}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-4 py-2.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Enrollment history ── */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Enrollment History
          </h2>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
              <GraduationCap className="h-8 w-8 opacity-30" />
              <p className="text-sm">Loading transcript…</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
              <GraduationCap className="h-8 w-8 opacity-30" />
              <p className="text-sm">No enrollment history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment, i) => {
                const isCurrent = enrollment.is_current;
                const accentColor = isCurrent ? '#059669' : '#0891b2';
                const isOpen = expanded[enrollment.id] ?? false;
                return (
                  <motion.div key={enrollment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                      <div className="h-1 w-full" style={{ background: accentColor }} />
                      {/* Header row */}
                      <button className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => toggle(enrollment.id)}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                              {enrollment.program_name ?? 'Program'} · {enrollment.year_level_name ?? 'Year level'}
                            </span>
                            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                              style={{ background: isCurrent ? 'rgba(5,150,105,0.1)' : 'rgba(8,145,178,0.1)', color: accentColor }}>
                              {isCurrent ? 'Current' : enrollment.status ?? 'Completed'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {enrollment.term_label ?? '—'} · {enrollment.school_year_name ?? '—'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <span>{enrollment.student_subjects?.length ?? 0} subject{(enrollment.student_subjects?.length ?? 0) !== 1 ? 's' : ''}</span>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {/* Subjects list */}
                      {isOpen && (
                        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: 'var(--border)' }}>
                          {!enrollment.student_subjects?.length ? (
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No subjects recorded.</p>
                          ) : (
                            <div className="space-y-2">
                              {enrollment.student_subjects.map((subject) => (
                                <div key={subject.id}
                                  className="flex items-center justify-between rounded-xl px-4 py-3"
                                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
                                    <div>
                                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                                        {subject.subject_name}
                                      </p>
                                      <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                        {subject.subject_code}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                    <div className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5" />
                                      {subject.teacher_name ?? 'TBA'}
                                    </div>
                                    {(subject.schedule_days || subject.schedule_time) && (
                                      <div className="flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {[subject.schedule_days, subject.schedule_time].filter(Boolean).join(' · ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
