import Link from 'next/link';
import Image from 'next/image';
import { PublicNav } from '@/components/navigation/PublicNav';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Layers, Plug } from 'lucide-react';

const pillars = [
  {
    icon: Eye,
    step: '01',
    title: 'Clarity first',
    detail: 'Every screen is designed around the daily priorities of students and teachers — no clutter, no noise.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
  {
    icon: Layers,
    step: '02',
    title: 'Scalable by design',
    detail: 'Feature-based architecture keeps growth organized across departments and academic years.',
    accent: 'var(--brand-gold)',
    muted: 'var(--brand-gold-muted)',
  },
  {
    icon: Plug,
    step: '03',
    title: 'API-ready foundation',
    detail: 'Django REST backend with JWT auth, real-time WebSocket notifications, and AI-assisted grading built in.',
    accent: 'var(--brand-blue)',
    muted: 'var(--brand-blue-muted)',
  },
];

const team = [
  { initials: 'ED', name: 'Elton Dagodog', role: 'Developer', gradient: 'var(--brand-blue)' },
  { initials: 'AS', name: 'Engr. Alden Salazar', role: 'School Owner', gradient: 'var(--brand-blue)' },
  { initials: 'EA', name: 'Era Mae Abelgas', role: 'QA', gradient: 'var(--brand-blue)' },
];

const facts = [
  { label: 'Founded', value: '1983' },
  { label: 'Focus', value: 'Junior & Senior High School' },
  { label: 'Stack', value: 'Next.js + Django + Rust' },
  { label: 'Real-time', value: 'WebSocket + Notifications' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 left-0 h-[400px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'rgba(13,18,130,0.2)' }}
        />
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />
        <div className="absolute -right-12 top-24 h-32 w-32 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />

        <div className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl space-y-6">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue-deep)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
                Our story
              </span>
              <h1 className="text-5xl font-semibold leading-[1.12] sm:text-6xl" style={{ color: 'var(--foreground)' }}>
                About <span style={{ color: 'var(--brand-blue)' }}>SCSIT NEXUS</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                SCSIT NEXUS is a learning management system built for Junior and Senior High School students and teachers at SCSIT — covering subjects, assignments, quizzes, online classes, and real-time notifications.
                SCSIT NEXUS stands for Salazar Colleges of Science and Institute of Technology.
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl" style={{ background: 'var(--brand-blue)' }} />
              <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ border: '1px solid var(--border)' }}>
                <Image
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80"
                  alt="School building"
                  width={800}
                  height={500}
                  className="h-72 w-full object-cover"
                  unoptimized
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,18,130,0.4) 0%, transparent 60%)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>
              Built with purpose, designed with care
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            We believe great school software should feel effortless. SCSIT NEXUS was built to remove friction from academic operations — so teachers can manage classes and grade work, and students can focus on learning.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Every design decision is grounded in real school workflows, not abstract product thinking.
            </p>
            <Button as={Link} href="/dashboard" size="lg">Explore the platform</Button>
          </div>

          {/* Facts card */}
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{ border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(47,111,246,0.06)' }}
          >
            <Image
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80"
              alt="Classroom"
              width={800}
              height={300}
              className="h-40 w-full object-cover"
              unoptimized
            />
            <div className="p-8" style={{ background: 'var(--surface)' }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-40" style={{ border: '1px solid var(--border)' }} />
              <div className="relative space-y-0 divide-y divide-[var(--border)]">
                {facts.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-4">
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{item.label}</span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue-deep)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-block h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
          <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Our core principles</h2>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>The values that guide every product decision.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, step, title, detail, accent, muted }) => (
            <Card key={title} className="relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
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

      {/* Team */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div
          className="rounded-3xl p-10"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(47,111,246,0.06)' }}
        >
          <div className="mb-10 text-center">
            <div className="mb-3 inline-block h-0.5 w-10 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>The people behind SCSIT NEXUS</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-4 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-semibold text-white shadow-lg"
                  style={{ background: member.gradient }}
                >
                  {member.initials}
                </div>
                <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{member.name}</div>
                  <div
                    className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue-deep)' }}
                  >
                    {member.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
