'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentNav } from '@/components/navigation/nav-config';
import { useProgress } from '@/features/progress/hooks/useProgress';

export default function StudentProgressPage() {
  const { data: progress, isLoading } = useProgress();

  return (
    <AppShell title="Student Dashboard" subtitle="Progress" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Progress"
          description="Track your completion, on‑time submissions, and learning goals."
        />

        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            Loading progress…
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Completion rate', value: `${progress?.completionRate ?? 0}%` },
                { label: 'On‑time submissions', value: `${progress?.onTimeSubmissions ?? 0}%` },
                { label: 'Attendance rate', value: `${progress?.attendanceRate ?? 0}%` },
                { label: 'Weekly streak', value: `${progress?.streakWeeks ?? 0} weeks` },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {(progress?.goals ?? []).length ? (
                  progress?.goals?.map((goal) => (
                    <div key={goal.label} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-4">
                      <div className="text-xs text-neutral-500">{goal.label}</div>
                      <div className="mt-1 text-sm font-semibold text-neutral-900">
                        {goal.value} / {goal.target}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">No goals available yet.</div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Progress snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Completion', value: progress?.completionRate ?? 0 },
                    { label: 'On‑time submissions', value: progress?.onTimeSubmissions ?? 0 },
                    { label: 'Attendance', value: progress?.attendanceRate ?? 0 },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, metric.value))}%`,
                            background: 'linear-gradient(90deg, #1a3a8f 0%, #2f6ff6 100%)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goal progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(progress?.goals ?? []).length ? (
                    progress?.goals?.map((goal) => {
                      const ratio = goal.target ? Math.min(100, Math.round((goal.value / goal.target) * 100)) : 0;
                      return (
                        <div key={goal.label} className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>{goal.label}</span>
                            <span>
                              {goal.value}/{goal.target} ({ratio}%)
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${ratio}%`,
                                background: 'linear-gradient(90deg, #0f766e 0%, #2dd4bf 100%)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-neutral-500">No goals available yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
