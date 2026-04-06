import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Zap, PieChart } from 'lucide-react';

const highlights = [
  {
    icon: BookOpen,
    step: '01',
    title: 'Centralized curriculum',
    detail: 'Track subjects, lessons, and assessments from a single organized workspace.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
  {
    icon: Zap,
    step: '02',
    title: 'Intuitive workflows',
    detail: 'Streamlined submission and grading cycles that save time every day.',
    accent: 'var(--brand-gold)',
    muted: 'var(--brand-gold-muted)',
  },
  {
    icon: PieChart,
    step: '03',
    title: 'Clear analytics',
    detail: 'Real-time insights by class and department, always within reach.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
];

const stats = [
  { value: '12+', label: 'Academic roles supported' },
  { value: '100%', label: 'Role-based access control' },
  { value: '∞', label: 'Scalable by design' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(47,111,246,0.3) 0%, transparent 70%)' }}
        />
        {/* Subtle ring decorations */}
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />
        <div className="absolute -right-16 top-6 h-36 w-36 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />

        <div className="mx-auto w-full max-w-6xl px-6 py-28 text-center">
          <span
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue-deep)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
            Welcome to SCSIT NEXUS
          </span>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.12]" style={{ color: 'var(--foreground)' }}>
            A clean home base for{' '}
            <span style={{ color: 'var(--brand-blue)' }}>learning operations</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
            Organize academic delivery, track outcomes, and keep every role aligned in a simple, modern workspace.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button as={Link} href="/dashboard" size="lg">Explore dashboards</Button>
            <Button variant="outline" as={Link} href="/about" size="lg">Learn more</Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 mx-auto -mt-6 w-full max-w-5xl px-6">
        <div
          className="grid grid-cols-3 divide-x divide-[var(--border)] overflow-hidden rounded-2xl shadow-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(47,111,246,0.1)',
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-7 text-center">
              <div className="text-3xl font-semibold" style={{ color: 'var(--brand-blue)' }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: 'rgba(11,26,53,0.5)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-block h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
          <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Everything you need, nothing you don't</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(11,26,53,0.5)' }}>Built around the real daily needs of schools.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ icon: Icon, step, title, detail, accent, muted }) => (
            <Card
              key={title}
              className="group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute top-0 left-0 h-0.5 w-full" style={{ background: accent }} />
              <CardContent className="space-y-4 p-7 pt-8">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: muted, color: accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-semibold" style={{ color: 'rgba(11,26,53,0.08)' }}>{step}</span>
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: 'linear-gradient(135deg, #1a3a8f 0%, #2f6ff6 100%)', boxShadow: '0 20px 60px rgba(47,111,246,0.25)' }}
        >
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10" style={{ background: 'white' }} />
          <h2 className="relative text-3xl font-semibold text-white">Ready to get started?</h2>
          <p className="relative mt-3 text-sm text-white/65">Jump into the dashboard and explore every role.</p>
          <div className="relative mt-8">
            <Button as={Link} href="/dashboard" size="lg" variant="secondary">
              Go to dashboard
            </Button>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs md:flex-row md:items-center md:justify-between" style={{ color: 'rgba(11,26,53,0.45)' }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--brand-blue)' }} />
            SCSIT NEXUS — E-Learning Platform
          </div>
          <div className="flex gap-5">
            {([['Home', '/home'], ['About', '/about'], ['Directory', '/contact'], ['Sign in', '/login']] as const).map(([label, href]) => (
              <Link key={label} href={href} className="transition-colors hover:text-[var(--brand-blue)]">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
