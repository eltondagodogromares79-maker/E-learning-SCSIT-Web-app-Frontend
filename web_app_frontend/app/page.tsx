import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, ShieldCheck, BarChart3, GraduationCap, BookOpen, Users } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Unified learning workspace',
    description: 'Lessons, assignments, and assessments in one organized view.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based control',
    description: 'Tailored dashboards for students, teachers, and admins.',
    accent: 'var(--brand-gold)',
    muted: 'var(--brand-gold-muted)',
  },
  {
    icon: BarChart3,
    title: 'Actionable reporting',
    description: 'Track performance and engagement with clarity.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
];

const roles = [
  { icon: GraduationCap, title: 'Students', detail: 'Stay on top of lessons, assignments, and grades.' },
  { icon: BookOpen, title: 'Teachers', detail: 'Create content, grade faster, and manage classes.' },
  { icon: Users, title: 'Advisers', detail: 'Guide sections and track student progress.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background gradient blob */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(47,111,246,0.25) 0%, transparent 70%)' }}
          />
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-7">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue-deep)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
                  E-Learning Platform
                </span>
                <h1 className="text-5xl font-semibold leading-[1.12] sm:text-6xl" style={{ color: 'var(--foreground)' }}>
                  A modern LMS built for{' '}
                  <span
                    className="relative inline-block"
                    style={{ color: 'var(--brand-blue)' }}
                  >
                    real-world
                    <span
                      className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full"
                      style={{ background: 'var(--brand-blue)', opacity: 0.3 }}
                    />
                  </span>{' '}
                  schools.
                </h1>
                <p className="text-lg leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
                  SCSIT NEXUS brings learning programs, assessments, and academic performance into a clean, focused workspace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button as={Link} href="/dashboard" size="lg">
                    Explore dashboards
                  </Button>
                  <Button variant="outline" as={Link} href="/login" size="lg">
                    Sign in
                  </Button>
                </div>
              </div>

              {/* Hero visual — no mock data */}
              <div
                className="overflow-hidden rounded-3xl shadow-2xl"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              >
                <div
                  className="px-6 pt-6 pb-4"
                  style={{ background: 'linear-gradient(135deg, #1a3a8f 0%, #2f6ff6 100%)' }}
                >
                  <h3 className="text-xl font-semibold text-white">One platform. Every role.</h3>
                  <p className="mt-1 text-sm text-white/60">Students, teachers, and advisers — all in one place.</p>
                </div>
                <div className="space-y-3 p-6">
                  {[
                    { icon: GraduationCap, label: 'Students', desc: 'Quizzes, grades, and lessons at a glance.' },
                    { icon: BookOpen, label: 'Teachers', desc: 'Manage classes, assignments, and grading.' },
                    { icon: Users, label: 'Advisers', desc: 'Monitor sections and track student progress.' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-4 rounded-xl p-4"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue)' }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{label}</div>
                        <div className="mt-0.5 text-xs leading-relaxed" style={{ color: 'rgba(11,26,53,0.5)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, accent, muted }) => (
              <Card
                key={title}
                className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="absolute top-0 left-0 h-0.5 w-full" style={{ background: accent }} />
                <CardContent className="space-y-4 p-6 pt-7">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: muted, color: accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div
            className="rounded-3xl p-10"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(47,111,246,0.06)' }}
          >
            <div className="grid gap-10 lg:grid-cols-[0.55fr,1fr]">
              <div className="space-y-3">
                <div className="h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
                <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Built for every academic role</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
                  Each role gets a personalized dashboard with exactly the tools needed for daily work.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {roles.map(({ icon: Icon, title, detail }) => (
                  <div
                    key={title}
                    className="rounded-2xl p-5 transition-shadow hover:shadow-md"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue)' }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--brand-blue-deep)' }}>{title}</div>
                    <div className="mt-1.5 text-xs leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div
            className="relative overflow-hidden flex flex-col items-start gap-6 rounded-3xl p-10 md:flex-row md:items-center md:justify-between"
            style={{ background: 'linear-gradient(135deg, #1a3a8f 0%, #2f6ff6 100%)', boxShadow: '0 20px 60px rgba(47,111,246,0.25)' }}
          >
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-10" style={{ background: 'white' }} />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10" style={{ background: 'white' }} />
            <div className="relative">
              <div className="mb-2 h-0.5 w-10 rounded-full bg-white/40" />
              <h2 className="text-2xl font-semibold text-white">Ready to connect your learning system?</h2>
              <p className="mt-2 text-sm text-white/65">Start with the UI today and plug in your API later.</p>
            </div>
            <Button as={Link} href="/dashboard" size="lg" variant="secondary" className="relative shrink-0">
              View dashboards
            </Button>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs md:flex-row md:items-center md:justify-between" style={{ color: 'rgba(11,26,53,0.45)' }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--brand-blue)' }} />
            SCSIT NEXUS — E-Learning Platform
          </div>
          <div className="flex gap-5">
            {[['Home', '/home'], ['About', '/about'], ['Directory', '/contact'], ['Sign in', '/login']].map(([label, href]) => (
              <Link key={label} href={href} className="transition-colors hover:text-[var(--brand-blue)]">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
