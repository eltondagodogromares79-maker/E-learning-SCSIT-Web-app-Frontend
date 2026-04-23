'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import type { AttendanceSession } from '@/types';
import { Search, CalendarCheck, Clock, User, BookOpen, CheckCircle, XCircle, AlertCircle, MinusCircle, ChevronRight } from 'lucide-react';

type StatusFilter = 'all' | 'present' | 'absent' | 'late' | 'excused';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'late',    label: 'Late' },
  { value: 'absent',  label: 'Absent' },
  { value: 'excused', label: 'Excused' },
];

const statusStyle: Record<string, { color: string; light: string; label: string }> = {
  present: { color: '#059669', light: 'rgba(5,150,105,0.1)',   label: 'Present' },
  absent:  { color: '#dc2626', light: 'rgba(220,38,38,0.1)',   label: 'Absent'  },
  late:    { color: '#d97706', light: 'rgba(217,119,6,0.1)',   label: 'Late'    },
  excused: { color: '#6b7280', light: 'rgba(107,114,128,0.1)', label: 'Excused' },
  pending: { color: '#0891b2', light: 'rgba(8,145,178,0.1)',   label: 'Pending' },
};

function formatWhen(value: string) {
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function buildTitle(session: AttendanceSession) {
  if (session.title) return session.title;
  if (session.subject_name) return `${session.subject_name} Attendance`;
  return 'Attendance Session';
}

export default function StudentAttendancePage() {
  const { data: sessions = [] } = useAttendanceSessions();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      const key = s.my_status ?? 'pending';
      if (statusFilter !== 'all' && key !== statusFilter) return false;
      if (!q) return true;
      return [s.title, s.subject_name, s.subject_code, s.section_name]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [sessions, query, statusFilter]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    sessions.forEach((s) => {
      const k = s.my_status as keyof typeof c;
      if (k in c) c[k]++;
    });
    return c;
  }, [sessions]);

  return (
    <AppShell title="Student Dashboard" subtitle="Attendance" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Attendance</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Attendance</h1>
              <p className="mt-2 text-sm text-white/70">{sessions.length} total session{sessions.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Present', value: counts.present, icon: <CheckCircle className="h-4 w-4" /> },
                { label: 'Late',    value: counts.late,    icon: <AlertCircle className="h-4 w-4" /> },
                { label: 'Absent',  value: counts.absent,  icon: <XCircle className="h-4 w-4" /> },
                { label: 'Excused', value: counts.excused, icon: <MinusCircle className="h-4 w-4" /> },
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

        {/* ── Search + filters ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions…"
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
          </div>
        </div>

        {/* ── Cards ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <CalendarCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">{query.trim() ? `No sessions found for "${query.trim()}".` : 'No attendance sessions yet.'}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((session) => {
              const key = session.my_status ?? 'pending';
              const style = statusStyle[key] ?? statusStyle.pending;
              return (
                <motion.div key={session.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <Link href={`/dashboard/student/attendance/${session.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="h-1.5 w-full" style={{ background: style.color }} />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
                          style={{ color: 'var(--muted-foreground)' }}>
                          <BookOpen className="h-3.5 w-3.5" />
                          {session.subject_name ?? session.section_name ?? 'General'}
                          {session.subject_code ? ` · ${session.subject_code}` : ''}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: style.light, color: style.color }}>
                          {style.label}
                        </span>
                      </div>
                      <h3 className="mb-4 flex-1 text-base font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {buildTitle(session)}
                      </h3>
                      <div className="mb-5 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Clock className="h-3.5 w-3.5" />
                          {formatWhen(session.scheduled_at)}
                        </div>
                        {session.created_by_name && (
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <User className="h-3.5 w-3.5" />
                            {session.created_by_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: style.color }}>
                          View details <ChevronRight className="h-3.5 w-3.5" />
                        </span>
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
