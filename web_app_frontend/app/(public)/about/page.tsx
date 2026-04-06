import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const pillars = [
  {
    icon: '01',
    title: 'Clarity first',
    detail: 'Every screen is designed around the daily priorities of educators and learners — no clutter, no noise.',
  },
  {
    icon: '02',
    title: 'Scalable by design',
    detail: 'Feature-based architecture keeps growth organized across departments and academic years.',
  },
  {
    icon: '03',
    title: 'API-ready foundation',
    detail: 'Strong TypeScript types mirror backend models for seamless integration when you are ready.',
  },
];

const team = [
  { initials: 'ED', name: 'Elton Dagodog', role: 'Developer' },
  { initials: 'AS', name: 'Engr. Alden Salazar', role: 'School Owner' },
  { initials: 'EA', name: 'Era Mae Abelgas', role: 'QA' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full" style={{ border: '1px solid var(--border)' }} />
        <div className="absolute -right-12 top-24 h-32 w-32 rounded-full" style={{ border: '1px solid var(--border)' }} />
        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <span
              className="mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-gold)' }}
            >
              Our story
            </span>
            <h1 className="text-5xl font-semibold leading-tight sm:text-6xl" style={{ color: 'var(--foreground)' }}>
              About <span style={{ color: 'var(--brand-blue)' }}>SCSIT NEXUS</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
              SCSIT NEXUS is a UI-first learning management experience that balances simplicity with powerful academic workflows — built for the real world of K-12 schools.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-5">
            <div className="inline-block h-1 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>
              Built with purpose, designed with care
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
              We believe that great software for education should feel effortless. SCSIT NEXUS was created to remove friction from academic operations — so teachers can teach, students can learn, and administrators can lead.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
              Every design decision is grounded in real school workflows, not abstract product thinking.
            </p>
            <Button as={Link} href="/dashboard" size="lg">Explore the platform</Button>
          </div>

          {/* Decorative card */}
          <div
            className="relative rounded-3xl p-8 overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ border: '1px solid var(--border)' }} />
            <div className="relative space-y-6">
              {[
                { label: 'Founded', value: '2024' },
                { label: 'Focus', value: 'K-12 Education' },
                { label: 'Architecture', value: 'Feature-based' },
                { label: 'Stack', value: 'Next.js + TypeScript' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm" style={{ color: 'rgba(11,26,53,0.55)' }}>{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-block h-1 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
          <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Our core principles</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(11,26,53,0.5)' }}>The values that guide every product decision.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Card key={pillar.title} className="relative overflow-hidden transition-shadow hover:shadow-xl">
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ background: i === 1 ? 'var(--brand-gold)' : 'var(--brand-blue)' }}
              />
              <CardContent className="p-7 pt-8 space-y-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ background: i === 1 ? 'var(--brand-gold-muted)' : 'var(--brand-blue-muted)', color: i === 1 ? 'var(--brand-gold)' : 'var(--brand-blue)' }}
                >
                  {pillar.icon}
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{pillar.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{pillar.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="rounded-3xl p-10"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(26,111,212,0.06)' }}
        >
          <div className="mb-10 text-center">
            <div className="mb-3 inline-block h-1 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>The people behind SCSIT NEXUS</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-3 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-semibold text-white"
                  style={{ background: 'var(--foreground)', boxShadow: 'none' }}
                >
                  {member.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{member.name}</div>
                  <div className="mt-0.5 text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>{member.role}</div>
                </div>
              </div>
            ))}
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
