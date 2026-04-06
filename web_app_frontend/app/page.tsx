import Link from 'next/link';
import { PublicNav } from '@/components/navigation/PublicNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const featureCards = [
  {
    title: 'Unified learning workspace',
    description: 'Lessons, assignments, and assessments in one organized view.',
  },
  {
    title: 'Role-based control',
    description: 'Tailored dashboards for students, teachers, and admins.',
  },
  {
    title: 'Actionable reporting',
    description: 'Track performance and engagement with clarity.',
  },
];

const roles = [
  { title: 'Students', detail: 'Stay on top of lessons, assignments, and grades.' },
  { title: 'Teachers', detail: 'Create content, grade faster, and manage classes.' },
  { title: 'Advisers', detail: 'Guide sections and track student progress.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-7">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-gold)' }}
              >
                E-Learning Platform
              </span>
              <h1 className="text-5xl font-semibold leading-tight sm:text-6xl" style={{ color: 'var(--foreground)' }}>
                A modern LMS built for{' '}
                <span style={{ color: 'var(--brand-blue)' }}>real-world</span> schools.
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

            {/* Hero card */}
            <Card className="overflow-hidden shadow-xl" style={{ border: '1px solid var(--border)' }}>
              <div className="px-6 pt-6 pb-3" style={{ background: 'var(--brand-blue)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Live Preview</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Daily Learning Snapshot</h3>
                <p className="mt-1 text-sm text-white/70">Attendance, assignments, and lessons at a glance.</p>
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Attendance', value: '96%' },
                    { label: 'Assignments', value: '3 due' },
                    { label: 'Lessons', value: '18 active' },
                    { label: 'Quizzes', value: '2 live' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl p-4"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="text-xs font-medium" style={{ color: 'var(--brand-blue)' }}>{item.label}</div>
                      <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--brand-gold-muted)', border: '1px solid rgba(17,17,17,0.12)' }}>
                  <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Today</div>
                  <div className="mt-1.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>Math review session at 2:00 PM</div>
                  <div className="mt-2 text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>Next: Science lab on Friday</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((feature, i) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden shadow-sm transition-shadow hover:shadow-lg"
                style={{ border: '1px solid var(--border)' }}
              >
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ background: i === 1 ? 'var(--brand-gold)' : 'var(--brand-blue)' }}
                />
                <CardContent className="space-y-3 p-6 pt-7">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <div
            className="rounded-3xl p-10"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="grid gap-10 lg:grid-cols-[0.6fr,1fr]">
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Built for every academic role</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
                  Each role gets a personalized dashboard with exactly the tools needed for daily work.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <div
                    key={role.title}
                    className="rounded-2xl p-5"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: 'var(--brand-blue-deep)' }}
                    >
                      {role.title}
                    </div>
                    <div className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(11,26,53,0.55)' }}>{role.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div
            className="flex flex-col items-start gap-6 rounded-3xl p-10 md:flex-row md:items-center md:justify-between"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(26,111,212,0.08)' }}
          >
            <div>
              <div
                className="mb-2 inline-block h-1 w-10 rounded-full"
                style={{ background: 'var(--brand-gold)' }}
              />
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Ready to connect your learning system?</h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(11,26,53,0.55)' }}>Start with the UI today and plug in your API later.</p>
            </div>
            <Button as={Link} href="/dashboard" size="lg">
              View dashboards
            </Button>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-xs md:flex-row md:items-center md:justify-between" style={{ color: 'rgba(11,26,53,0.45)' }}>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: 'var(--brand-gold)' }}
            />
            SCSIT NEXUS — E-Learning Platform
          </div>
          <div className="flex gap-5">
            {[["Home", "/home"], ["About", "/about"], ["Sign in", "/login"]].map(([label, href]) => (
              <Link key={label} href={href} className="transition-colors hover:text-[var(--brand-blue)]">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
