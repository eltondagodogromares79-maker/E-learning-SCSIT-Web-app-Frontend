'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { quizService } from '@/features/quizzes/services/quizService';
import type { QuizProctorLog } from '@/types';
import { useToast } from '@/components/ui/toast';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertTriangle, XCircle, Camera, Search, RefreshCw, Clock } from 'lucide-react';

function statusColor(status: string) {
  if (status === 'terminated') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function eventTypeColor(type: string) {
  if (type.includes('terminat')) return 'bg-red-50 text-red-700';
  if (type.includes('warn')) return 'bg-amber-50 text-amber-700';
  if (type.includes('snapshot') || type.includes('photo')) return 'bg-purple-50 text-purple-700';
  return 'bg-blue-50 text-blue-700';
}

export default function TeacherQuizProctorLogsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const { data: quiz } = useQuiz(quizId);
  const { showToast } = useToast();
  const [logs, setLogs] = useState<QuizProctorLog[]>([]);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<QuizProctorLog | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const seededRef = useRef(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await quizService.getProctorLogs({ quiz_id: quizId });
      setLogs(data);
    } catch (error: any) {
      const apiError = error?.response?.data?.error ?? error?.message ?? 'Unable to load proctor logs.';
      showToast({ title: 'Load failed', description: apiError, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [quizId]);

  useEffect(() => {
    if (seededRef.current) return;
    const initial = searchParams.get('student');
    if (initial) { setQuery(initial); seededRef.current = true; }
  }, [searchParams]);

  const filteredLogs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return logs;
    return logs.filter((log) =>
      [log.student_name, log.student_id].filter(Boolean).join(' ').toLowerCase().includes(trimmed)
    );
  }, [logs, query]);

  const totalWarnings = logs.reduce((s, l) => s + (l.warnings ?? 0), 0);
  const totalTerminations = logs.reduce((s, l) => s + (l.terminations ?? 0), 0);
  const totalSnapshots = logs.reduce((s, l) => s + (l.snapshots?.length ?? 0), 0);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Proctor Logs" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Proctor Logs</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">
              {quiz?.title ?? 'Quiz'} — Proctor Logs
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {logs.length} session{logs.length !== 1 ? 's' : ''} · Review violations, warnings, and snapshots
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Sessions', value: logs.length, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Warnings', value: totalWarnings, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Terminations', value: totalTerminations, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Snapshots', value: totalSnapshots, icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-5 shadow-sm">
              <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900">{value}</div>
              <div className="mt-0.5 text-xs uppercase tracking-[0.2em] text-neutral-400">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Sessions list ── */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Proctor sessions</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search student…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={fetchLogs} className="flex items-center gap-1.5">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                {loading ? 'Loading proctor logs…' : 'No logs yet.'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.3)] hover:bg-white"
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{log.student_name}</div>
                      <div className="mt-0.5 text-xs text-neutral-400">Session ID: {log.id}</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>

                  {/* Stat chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />{log.warnings} warning{log.warnings !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" />{log.terminations} termination{log.terminations !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                      <Camera className="h-3 w-3" />{log.snapshots.length} snapshot{log.snapshots.length !== 1 ? 's' : ''}
                    </span>
                    {log.penalty_percent > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                        −{log.penalty_percent}% penalty
                      </span>
                    )}
                    {log.started_at && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
                        <Clock className="h-3 w-3" />{new Date(log.started_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Recent events */}
                  {log.events.length > 0 && (
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {log.events.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-white p-3 text-xs">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${eventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                          <div className="mt-1.5 text-neutral-700">{event.detail ?? '—'}</div>
                          <div className="mt-1 text-[10px] text-neutral-400">{new Date(event.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => setSelectedLog(log)}>
                      View snapshots
                    </Button>
                    {log.events.length > 4 && (
                      <span className="text-xs text-neutral-400">+{log.events.length - 4} more events</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ── Snapshot gallery dialog ── */}
        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => (!open ? setSelectedLog(null) : null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Snapshots — {selectedLog?.student_name}
              </DialogTitle>
            </DialogHeader>

            {/* All events */}
            {selectedLog?.events?.length ? (
              <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-neutral-50 p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">All proctor events</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedLog.events.map((event) => (
                    <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgba(15,23,42,0.06)] bg-white px-3 py-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${eventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      <span className="flex-1 text-neutral-700">{event.detail ?? '—'}</span>
                      <span className="text-neutral-400">{new Date(event.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Snapshots grid */}
            <div className="grid gap-3 md:grid-cols-3">
              {selectedLog?.snapshots.length ? (
                selectedLog.snapshots.map((snapshot) => (
                  <a
                    key={snapshot.id}
                    href={snapshot.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-[rgba(15,23,42,0.08)] bg-white transition hover:border-[rgba(37,99,235,0.3)] hover:shadow-md"
                  >
                    <img src={snapshot.image_url} alt={snapshot.reason ?? 'snapshot'} className="h-44 w-full object-cover" />
                    <div className="p-2.5">
                      <div className="text-xs font-medium text-neutral-700">{snapshot.reason ?? 'Snapshot'}</div>
                      <div className="mt-0.5 text-[10px] text-neutral-400">{new Date(snapshot.created_at).toLocaleString()}</div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-3 rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500">
                  No snapshots captured.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
