import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, ShieldCheck, BarChart3, GraduationCap, BookOpen } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Unified learning workspace',
    description: 'Learning materials, assignments, quizzes, and online classes in one organized view.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based control',
    description: 'Tailored dashboards for students and teachers.',
    accent: 'var(--brand-gold)',
    muted: 'var(--brand-gold-muted)',
  },
  {
    icon: BarChart3,
    title: 'Actionable reporting',
    description: 'Track student performance, attendance, and quiz results with clarity.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
];

const roles = [
  { icon: GraduationCap, title: 'Students', detail: 'Access learning materials, assignments, quizzes, and join online classes.' },
  { icon: BookOpen, title: 'Teachers', detail: 'Manage classes, create quizzes and assignments, grade submissions, and host live classes.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Full background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1400&q=80"
              alt="Students in classroom"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,18,130,0.88) 0%, rgba(13,18,130,0.70) 50%, rgba(30,79,214,0.60) 100%)' }} />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-28">
            <div className="max-w-2xl space-y-7">
              {/* School level badge */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  Junior High School
                </span>
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Senior High School
                </span>
              </div>

              <h1 className="text-5xl font-bold leading-[1.1] text-white sm:text-6xl">
                SCSIT NEXUS: A modern LMS built for{' '}
                <span className="relative inline-block">
                  SCSIT
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-yellow-400" />
                </span>{' '}
                school.
              </h1>

              <p className="text-lg leading-relaxed text-white/85">
                SCSIT NEXUS brings learning programs, assessments, and academic performance into a clean, focused workspace.
                SCSIT NEXUS stands for Salazar Colleges of Science and Institute of Technology.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button as={Link} href="/dashboard" size="lg" style={{ background: 'white', color: '#0d1282' }}>
                  Explore dashboards
                </Button>
                <Button as={Link} href="/login" size="lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                  Sign in
                </Button>
              </div>

              {/* Role pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { label: 'Students', icon: GraduationCap },
                  { label: 'Teachers', icon: BookOpen },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Icon className="h-3.5 w-3.5 text-white/80" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 pb-16">
          <div className="mb-10 text-center">
            <div className="mb-3 inline-block h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Focused on Junior & Senior High School</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>Built specifically for the needs of JHS and SHS students and teachers at SCSIT.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(251,191,36,0.12)', color: '#b45309', border: '1px solid rgba(251,191,36,0.3)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Junior High School
              </span>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(52,211,153,0.12)', color: '#065f46', border: '1px solid rgba(52,211,153,0.3)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Senior High School
              </span>
            </div>
          </div>
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
                <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Built for students &amp; teachers</h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    Each role gets a personalized dashboard with exactly the tools needed for daily work.
                  </p>
              </div>
          <div className="grid gap-5 md:grid-cols-2">
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
                    <div className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{detail}</div>
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
            style={{ background: 'var(--brand-blue)', boxShadow: '0 20px 60px rgba(13,18,130,0.25)' }}
          >
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-10" style={{ background: 'white' }} />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10" style={{ background: 'white' }} />
            <div className="relative">
              <div className="mb-2 h-0.5 w-10 rounded-full bg-white/40" />
              <h2 className="text-2xl font-semibold text-white">Ready to connect your learning system?</h2>
              <p className="mt-2 text-sm text-white/65">Sign in and start managing your classes today.</p>
            </div>
            <Button as={Link} href="/dashboard" size="lg" className="relative shrink-0" style={{ background: 'white', color: '#000' }}>
              View dashboards
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
