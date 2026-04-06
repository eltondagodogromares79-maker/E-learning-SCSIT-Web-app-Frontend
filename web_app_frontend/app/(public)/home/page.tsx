import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const highlights = [
  {
    icon: '01',
    title: 'Centralized curriculum',
    detail: 'Track subjects, lessons, and assessments from a single organized workspace.',
  },
  {
    icon: '02',
    title: 'Intuitive workflows',
    detail: 'Streamlined submission and grading cycles that save time every day.',
  },
  {
    icon: '03',
    title: 'Clear analytics',
    detail: 'Real-time insights by class and department, always within reach.',
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
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full" style={{ border: '1px solid var(--border)' }} />
        <div className="absolute -right-16 top-6 h-36 w-36 rounded-full" style={{ border: '1px solid var(--border)' }} />
        <div className="mx-auto w-full max-w-6xl px-6 py-24 text-center">
          <span
            className="mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-gold)' }}
          >
            Welcome to SCSIT NEXUS
          </span>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
            A clean home base for{' '}
            <span style={{ color: 'var(--brand-blue)' }}>learning operations</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
            Organize academic delivery, track outcomes, and keep every role aligned in a simple, modern workspace.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button as={Link} href="/dashboard" size="lg">Explore dashboards</Button>
            <Button variant="outline" as={Link} href="/about" size="lg">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="mx-auto w-full max-w-6xl px-6 -mt-6 relative z-10">
        <div
          className="grid grid-cols-3 divide-x rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(26,111,212,0.1)' }}
        >
          {stats.map((s) => (
            <div key={s.label} className="py-6 text-center px-4">
              <div className="text-3xl font-semibold" style={{ color: 'var(--brand-blue)' }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: 'rgba(11,26,53,0.5)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-block h-1 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
          <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Everything you need, nothing you don't</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(11,26,53,0.5)' }}>Built around the real daily needs of schools.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item, i) => (
            <Card
              key={item.title}
              className="group relative overflow-hidden transition-shadow hover:shadow-xl"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ background: i === 1 ? 'var(--brand-gold)' : 'var(--brand-blue)' }}
              />
              <CardContent className="p-7 pt-8 space-y-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: i === 1 ? 'var(--brand-gold-muted)' : 'var(--brand-blue-muted)', color: i === 1 ? 'var(--brand-gold)' : 'var(--brand-blue)' }}
                >
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full" style={{ border: '1px solid var(--border)' }} />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full" style={{ border: '1px solid var(--border)' }} />
          <h2 className="relative text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Ready to get started?</h2>
          <p className="relative mt-3 text-sm" style={{ color: 'rgba(11,26,53,0.6)' }}>
            Jump into the dashboard and explore every role.
          </p>
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
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            SCSIT NEXUS — E-Learning Platform
          </div>
          <div className="flex gap-5">
            {([['Home', '/home'], ['About', '/about'], ['Sign in', '/login']] as const).map(([label, href]) => (
              <Link key={label} href={href} className="transition-colors hover:text-[var(--brand-blue)]">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
