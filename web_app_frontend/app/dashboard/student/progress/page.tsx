'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useProgress } from '@/features/progress/hooks/useProgress';
import { TrendingUp, CheckCircle, CalendarCheck, Zap, ClipboardList, BookOpen, HelpCircle, ChevronRight, Target } from 'lucide-react';

const QUICK_LINKS = [
  { href: '/dashboard/student/assignments',    label: 'Assignments',    icon: <ClipboardList className="h-4 w-4" />, color: '#0891b2' },
  { href: '/dashboard/student/lessons',        label: 'Lessons',        icon: <BookOpen className="h-4 w-4" />,      color: '#7c3aed' },
  { href: '/dashboard/student/quizzes',        label: 'Quizzes',        icon: <HelpCircle className="h-4 w-4" />,    color: '#059669' },
  { href: '/dashboard/student/online-classes', label: 'Online Classes', icon: <CalendarCheck className="h-4 w-4" />, color: '#d97706' },
];

function RadialProgress({ value, color }: { value: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

export default function StudentProgressPage() {
  const { data: progress } = useProgress();

  const stats = [
    { label: 'Completion',      value: progress?.completionRate ?? 0,      color: '#0891b2', icon: <CheckCircle className="h-5 w-5" />,   suffix: '%' },
    { label: 'Attendance',      value: progress?.attendanceRate ?? 0,      color: '#059669', icon: <CalendarCheck className="h-5 w-5" />, suffix: '%' },
    { label: 'On-time Submits', value: progress?.onTimeSubmissions ?? 0,   color: '#7c3aed', icon: <TrendingUp className="h-5 w-5" />,    suffix: '%' },
    { label: 'Streak',          value: progress?.streakWeeks ?? 0,         color: '#d97706', icon: <Zap className="h-5 w-5" />,           suffix: ' wks' },
  ];

  return (
    <AppShell title="Student Dashboard" subtitle="Progress" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Progress</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Progress</h1>
            <p className="mt-2 text-sm text-white/70">Track your academic performance at a glance.</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex flex-col overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="h-1.5 w-full" style={{ background: s.color }} />
                <div className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                    <p className="mt-1 text-3xl font-bold" style={{ color: s.color }}>
                      {s.value}{s.suffix}
                    </p>
                  </div>
                  <div className="relative flex items-center justify-center">
                    <RadialProgress value={typeof s.value === 'number' && s.suffix === '%' ? s.value : 100} color={s.color} />
                    <span className="absolute" style={{ color: s.color }}>{s.icon}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Goals ── */}
        {progress?.goals && progress.goals.length > 0 && (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Goals</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {progress.goals.map((goal, i) => {
                const pct = goal.target > 0 ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
                const color = pct >= 100 ? '#059669' : pct >= 60 ? '#0891b2' : '#d97706';
                return (
                  <motion.div key={goal.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="overflow-hidden rounded-2xl border p-5"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" style={{ color }} />
                          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{goal.label}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color }}>
                          {goal.value} / {goal.target}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                      </div>
                      <p className="mt-1.5 text-right text-xs font-semibold" style={{ color }}>{pct}%</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quick links ── */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Quick Links</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_LINKS.map((link, i) => (
              <motion.div key={link.href} whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                <Link href={link.href}
                  className="flex items-center justify-between overflow-hidden rounded-2xl border p-5 transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${link.color}18`, color: link.color }}>
                      {link.icon}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{link.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
