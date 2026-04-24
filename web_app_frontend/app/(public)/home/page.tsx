import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Zap, PieChart } from 'lucide-react';

const highlights = [
  {
    icon: BookOpen,
    step: '01',
    title: 'Centralized curriculum',
    detail: 'Track subjects, learning materials, and assessments from a single organized workspace.',
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
          style={{ background: 'rgba(13,18,130,0.2)' }}
        />
        {/* Subtle ring decorations */}
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />
        <div className="absolute -right-16 top-6 h-36 w-36 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />

        <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <span
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue-deep)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
                Welcome to SCSIT NEXUS
              </span>
              <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.12] lg:mx-0" style={{ color: 'var(--foreground)' }}>
                A clean home base for{' '}
                <span style={{ color: 'var(--brand-blue)' }}>learning operations</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed lg:mx-0" style={{ color: 'var(--muted-foreground)' }}>
                Organize academic delivery, track outcomes, and keep every role aligned in a simple, modern workspace.
                SCSIT NEXUS stands for Salazar Colleges of Science and Institute of Technology.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Button as={Link} href="/dashboard" size="lg">Explore dashboards</Button>
                <Button variant="outline" as={Link} href="/about" size="lg">Learn more</Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl" style={{ background: 'var(--brand-blue)' }} />
              <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ border: '1px solid var(--border)' }}>
                <Image
                  src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80"
                  alt="Students learning"
                  width={800}
                  height={512}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-80 w-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,18,130,0.5) 0%, transparent 60%)' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                    <p className="text-xs font-semibold text-white">🎓 Empowering students, teachers & advisers</p>
                  </div>
                </div>
              </div>
            </div>
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
            boxShadow: '0 8px 40px rgba(13,18,130,0.12)',
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-7 text-center">
              <div className="text-3xl font-semibold" style={{ color: 'var(--brand-blue)' }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-block h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
          <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Everything you need, nothing you don&apos;t</h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>Built around the real daily needs of schools.</p>
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
                  <span className="text-2xl font-semibold" style={{ color: 'rgba(13,18,130,0.12)' }}>{step}</span>
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: 'var(--brand-blue)', boxShadow: '0 20px 60px rgba(13,18,130,0.25)' }}
        >
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10" style={{ background: 'white' }} />
          <h2 className="relative text-3xl font-semibold text-white">Ready to get started?</h2>
          <p className="relative mt-3 text-sm text-white/65">Jump into the dashboard and explore every role.</p>
          <div className="relative mt-8">
            <Button as={Link} href="/dashboard" size="lg" style={{ background: 'white', color: '#000' }}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
import Image from 'next/image';
