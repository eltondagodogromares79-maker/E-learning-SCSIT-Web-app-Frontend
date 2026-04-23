import Link from 'next/link';
import { BookOpen, Users, LayoutGrid, Mail, MapPin, Phone, GraduationCap, Shield, Zap } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/home' },
  { label: 'About', href: '/about' },
  { label: 'Directory', href: '/contact' },
  { label: 'Sign in', href: '/login' },
];

const features = [
  { icon: BookOpen, label: 'Learning Materials', color: '#60a5fa' },
  { icon: GraduationCap, label: 'Quiz & Assessments', color: '#a78bfa' },
  { icon: Users, label: 'Role-based Dashboards', color: '#34d399' },
  { icon: Shield, label: 'Live Proctoring', color: '#f87171' },
  { icon: Zap, label: 'AI-assisted Grading', color: '#fbbf24' },
  { icon: LayoutGrid, label: 'Section Management', color: '#38bdf8' },
];

const contact = [
  { icon: MapPin, label: 'Salazar Colleges of Science and Institute of Technology' },
  { icon: Mail, label: 'admin@scsit.edu.ph' },
  { icon: Phone, label: '+63 (0) 123 456 7890' },
];

export function PublicFooter() {
  return (
    <footer style={{ background: 'linear-gradient(135deg, #0d1282 0%, #1e3a8a 60%, #1e4fd6 100%)' }}>
      {/* Top wave divider */}
      <div className="w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1440 40" className="w-full" style={{ display: 'block', marginBottom: '-1px' }} preserveAspectRatio="none">
          <path d="M0,40 C360,0 1080,0 1440,40 L1440,0 L0,0 Z" fill="var(--background)" />
        </svg>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SCSIT NEXUS</span>
            </div>
            <p className="text-xs leading-relaxed text-white">
              A modern learning management system built for Salazar Colleges of Science and Institute of Technology. Empowering students, teachers, and advisers.
            </p>
            <div className="flex flex-wrap gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-full px-3 py-1 text-xs font-medium text-white transition-all hover:bg-white/20 hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Platform Features</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white transition-colors hover:bg-white/10">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}25` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Contact</h3>
            <div className="space-y-3">
              {contact.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-start gap-3 text-xs text-white">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  {label}
                </div>
              ))}
            </div>

            {/* Decorative badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Shield className="h-3 w-3 text-emerald-400" />
              Secure · Role-based · Built for SCSIT
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="mt-10 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col gap-3 text-xs text-white md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
            © {new Date().getFullYear()} SCSIT NEXUS — E-Learning Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-white/70">Built for</span>
            <span className="font-semibold text-white">Salazar Colleges of Science and Institute of Technology</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
