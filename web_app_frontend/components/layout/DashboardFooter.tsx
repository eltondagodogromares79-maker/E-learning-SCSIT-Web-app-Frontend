import { BookOpen, Shield, Zap, GraduationCap } from 'lucide-react';

export function DashboardFooter() {
  return (
    <footer
      className="mt-auto px-6 py-5 sm:px-8"
      style={{ background: 'linear-gradient(135deg, #0d1282 0%, #1e3a8a 60%, #1e4fd6 100%)' }}
    >
      <div className="mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">SCSIT NEXUS</span>
          <span className="text-xs text-white/50">— E-Learning Platform</span>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { icon: GraduationCap, label: 'Quizzes & Assessments', color: '#a78bfa' },
            { icon: Shield,        label: 'Live Proctoring',        color: '#f87171' },
            { icon: Zap,           label: 'AI-assisted Grading',    color: '#fbbf24' },
          ].map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white/80"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Icon className="h-3 w-3" style={{ color }} />
              {label}
            </span>
          ))}
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
          © {new Date().getFullYear()} SCSIT NEXUS. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
