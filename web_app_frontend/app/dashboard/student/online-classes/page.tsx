'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { attendanceService } from '@/features/attendance/services/attendanceService';
import type { AttendanceSession } from '@/types';
import { Video, Clock, User, Search, BookOpen, Loader2, CheckCircle, XCircle } from 'lucide-react';

type StatusFilter = 'all' | 'live' | 'upcoming' | 'ended';
type SortOrder = 'newest' | 'oldest';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'live',     label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ended',    label: 'Ended' },
];

const attendanceStyles: Record<string, { color: string; light: string; label: string }> = {
  present: { color: '#059669', light: 'rgba(5,150,105,0.1)',  label: 'Present' },
  absent:  { color: '#dc2626', light: 'rgba(220,38,38,0.1)',  label: 'Absent'  },
  late:    { color: '#d97706', light: 'rgba(217,119,6,0.1)',  label: 'Late'    },
  excused: { color: '#6b7280', light: 'rgba(107,114,128,0.1)', label: 'Excused' },
  pending: { color: '#0891b2', light: 'rgba(8,145,178,0.1)',  label: 'Pending' },
};

function formatWhen(value: string) {
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function buildTitle(session: AttendanceSession) {
  if (session.title) return session.title;
  if (session.subject_name) return `${session.subject_name} Online Class`;
  return 'Online Class';
}

function getSessionState(session: AttendanceSession): 'live' | 'upcoming' | 'ended' {
  if (session.ended_at) return 'ended';
  if (session.is_live)  return 'live';
  return 'upcoming';
}

const stateStyle: Record<string, { color: string; light: string; label: string }> = {
  live:     { color: '#059669', light: 'rgba(5,150,105,0.1)',  label: 'Live'     },
  upcoming: { color: '#0891b2', light: 'rgba(8,145,178,0.1)',  label: 'Upcoming' },
  ended:    { color: '#6b7280', light: 'rgba(107,114,128,0.1)', label: 'Ended'   },
};

export default function StudentOnlineClassesPage() {
  const { data: sessions = [], refetch } = useAttendanceSessions();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [sectionFilter, setSectionFilter] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const onlineSessions = useMemo(
    () => sessions.filter((s) => s.is_online_class),
    [sessions]
  );

  const sections = useMemo(() => {
    const names = new Set(onlineSessions.map((s) => s.subject_name ?? s.section_name ?? '').filter(Boolean));
    return Array.from(names).sort();
  }, [onlineSessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...onlineSessions]
      .filter((s) => {
        const state = getSessionState(s);
        if (statusFilter !== 'all' && state !== statusFilter) return false;
        const subjectName = s.subject_name ?? s.section_name ?? '';
        if (sectionFilter && subjectName !== sectionFilter) return false;
        if (!q) return true;
        return [s.title, s.subject_name, s.subject_code, s.section_name]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at ?? left.scheduled_at).getTime();
        const rightTime = new Date(right.created_at ?? right.scheduled_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [onlineSessions, query, sortOrder, statusFilter]);

  const counts = useMemo(() => {
    const c = { live: 0, upcoming: 0, ended: 0 };
    onlineSessions.forEach((s) => { c[getSessionState(s)]++; });
    return c;
  }, [onlineSessions]);

  return (
    <AppShell title="Student Dashboard" subtitle="Online Classes" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Video className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Online Classes</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Live Classes</h1>
              <p className="mt-2 text-sm text-white/70">{onlineSessions.length} total session{onlineSessions.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Live',     value: counts.live,     icon: <Video className="h-4 w-4" /> },
                { label: 'Upcoming', value: counts.upcoming, icon: <Clock className="h-4 w-4" /> },
                { label: 'Ended',    value: counts.ended,    icon: <CheckCircle className="h-4 w-4" /> },
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
              placeholder="Search online classes…"
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
            <Video className="h-8 w-8 opacity-30" />
            <p className="text-sm">{query.trim() ? `No classes found for "${query.trim()}".` : 'No online classes scheduled yet.'}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((session) => {
              const state = getSessionState(session);
              const style = stateStyle[state];
              const attendanceKey = session.my_status ?? 'pending';
              const attendance = attendanceStyles[attendanceKey] ?? attendanceStyles.pending;
              const isJoining = joiningId === session.id;

              return (
                <motion.div key={session.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>

                    {/* Status bar */}
                    <div className="h-1.5 w-full" style={{ background: style.color }} />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Subject + state badge */}
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
                          style={{ color: 'var(--muted-foreground)' }}>
                          <BookOpen className="h-3.5 w-3.5" />
                          {session.subject_name ?? session.section_name ?? 'General'}
                          {session.subject_code ? ` · ${session.subject_code}` : ''}
                        </span>
                        <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: style.light, color: style.color }}>
                          {state === 'live' && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: style.color }} />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
                            </span>
                          )}
                          {style.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-4 flex-1 text-base font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {buildTitle(session)}
                      </h3>

                      {/* Meta */}
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

                      {/* Footer: attendance + join */}
                      <div className="flex items-center justify-between">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize"
                          style={{ background: attendance.light, color: attendance.color }}>
                          {attendance.label}
                        </span>
                        <button
                          disabled={isJoining || state === 'ended' || state === 'upcoming'}
                          onClick={async () => {
                            setJoiningId(session.id);
                            try {
                              const result = await attendanceService.joinSession(session.id);
                              const url = result?.join_url ?? session.join_url;
                              if (url) window.open(url, '_blank');
                            } finally {
                              await refetch();
                              setJoiningId(null);
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          style={state === 'live'
                            ? { background: 'var(--brand-blue)', color: '#fff' }
                            : { background: 'var(--surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                        >
                          {state === 'ended' ? (
                            <><XCircle className="h-3.5 w-3.5" />Ended</>
                          ) : state === 'upcoming' ? (
                            <><Clock className="h-3.5 w-3.5" />Waiting</>
                          ) : isJoining ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Joining…</>
                          ) : (
                            <><Video className="h-3.5 w-3.5" />Join Class</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
