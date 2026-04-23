'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Bell, Moon, Sun, Shield, Trash2, LogOut,
  Settings, Eye, EyeOff, Monitor,
} from 'lucide-react';

type Theme = 'system' | 'light' | 'dark';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ background: checked ? 'var(--brand-blue)' : 'var(--border)' }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
        <span style={{ color: 'var(--brand-blue)' }}>{icon}</span>
        <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{title}</h2>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>{children}</div>
    </motion.div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
        {description && <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { onLogout } = useAuth() as any;

  // Notification prefs
  const [notifAssignments, setNotifAssignments] = useState(true);
  const [notifQuizzes, setNotifQuizzes] = useState(true);
  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifGrades, setNotifGrades] = useState(false);

  // Appearance
  const [theme, setTheme] = useState<Theme>('system');

  // Privacy
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
    { value: 'light',  label: 'Light',  icon: <Sun className="h-4 w-4" /> },
    { value: 'dark',   label: 'Dark',   icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <AppShell title="Settings" subtitle="Preferences & account" navItems={studentNav}>
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Settings</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Preferences</h1>
            <p className="mt-2 text-sm text-white/70">Manage your notifications, appearance, and account settings.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Notifications ── */}
          <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
            <Row label="Assignments" description="New assignments and due date reminders">
              <Toggle checked={notifAssignments} onChange={setNotifAssignments} />
            </Row>
            <Row label="Quizzes" description="Quiz availability and results">
              <Toggle checked={notifQuizzes} onChange={setNotifQuizzes} />
            </Row>
            <Row label="Attendance" description="Session check-ins and records">
              <Toggle checked={notifAttendance} onChange={setNotifAttendance} />
            </Row>
            <Row label="Messages" description="Chat and direct messages">
              <Toggle checked={notifMessages} onChange={setNotifMessages} />
            </Row>
            <Row label="Grades & Feedback" description="When a teacher grades your work">
              <Toggle checked={notifGrades} onChange={setNotifGrades} />
            </Row>
          </Section>

          {/* ── Appearance ── */}
          <Section title="Appearance" icon={<Sun className="h-4 w-4" />}>
            <Row label="Theme" description="Choose your preferred color scheme">
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setTheme(opt.value)}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                    style={theme === opt.value
                      ? { background: 'var(--brand-blue)', color: '#fff', borderColor: 'var(--brand-blue)' }
                      : { background: 'var(--surface-2)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Privacy ── */}
          <Section title="Privacy" icon={<Shield className="h-4 w-4" />}>
            <Row label="Show online status" description="Let others see when you're active">
              <Toggle checked={showOnlineStatus} onChange={setShowOnlineStatus} />
            </Row>
            <Row label="Show progress to adviser" description="Allow your adviser to view your progress">
              <Toggle checked={showProgress} onChange={setShowProgress} />
            </Row>
          </Section>

          {/* ── Account ── */}
          <Section title="Account" icon={<Shield className="h-4 w-4" />}>
            <Row label="Change password" description="Update your login credentials">
              <a href="/change-password"
                className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-2)' }}>
                Change
              </a>
            </Row>
            <Row label="Profile" description="Edit your personal information">
              <a href="/profile"
                className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-2)' }}>
                Edit
              </a>
            </Row>
            <Row label="Sign out" description="Log out of your account">
              <button
                onClick={() => onLogout?.()}
                className="flex items-center gap-1.5 rounded-xl border px-4 py-1.5 text-xs font-semibold transition-all hover:bg-red-50"
                style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </Row>
          </Section>

        </div>
      </div>
    </AppShell>
  );
}
