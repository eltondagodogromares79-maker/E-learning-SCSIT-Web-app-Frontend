'use client';

import { use, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
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

export default function TeacherQuizProctorLogsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const { data: quiz } = useQuiz(quizId);
  const { showToast } = useToast();
  const [logs, setLogs] = useState<QuizProctorLog[]>([]);
  const [query, setQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<QuizProctorLog | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const filteredLogs = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return logs;
    return logs.filter((log) => {
      const haystack = [log.student_name, log.student_id].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [logs, query]);

  return (
    <AppShell title="Teacher Dashboard" subtitle="Proctor Logs" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={`Proctor logs${quiz?.title ? ` • ${quiz.title}` : ''}`}
          description="Review violations, warnings, and snapshots for each student attempt."
        />

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Proctor sessions</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search student"
                className="md:w-72"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button variant="secondary" onClick={fetchLogs}>
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">
                {loading ? 'Loading proctor logs…' : 'No logs yet.'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{log.student_name}</div>
                      <div className="text-xs text-neutral-500">Session {log.id}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <Badge variant="outline">{log.status}</Badge>
                      <span>Warnings: {log.warnings}</span>
                      <span>Terminations: {log.terminations}</span>
                      <span>Penalty: {log.penalty_percent}%</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {log.events.slice(0, 4).map((event) => (
                      <div key={event.id} className="rounded-lg border border-neutral-200 bg-[var(--surface-2)] p-2 text-xs">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{event.type}</div>
                        <div>{event.detail ?? '—'}</div>
                        <div className="text-[10px] text-neutral-400">{new Date(event.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setSelectedLog(log)}>
                      View snapshot gallery
                    </Button>
                    <div className="text-xs text-neutral-500">
                      {log.snapshots.length} snapshot{log.snapshots.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => (!open ? setSelectedLog(null) : null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Snapshot gallery</DialogTitle>
            </DialogHeader>
            {selectedLog?.events?.length ? (
              <div className="mb-4 rounded-xl border border-neutral-200 bg-white/80 p-3 text-xs text-neutral-600">
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">Proctor events</div>
                <div className="mt-2 space-y-2">
                  {selectedLog.events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-neutral-800">{event.type}</div>
                      <div className="text-neutral-500">{event.detail ?? '—'}</div>
                      <div className="text-neutral-400">{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3">
              {selectedLog?.snapshots.length ? (
                selectedLog.snapshots.map((snapshot) => (
                  <a
                    key={snapshot.id}
                    href={snapshot.image_url}
                    target="_blank"
                    className="group overflow-hidden rounded-xl border border-neutral-200 bg-white"
                  >
                    <img src={snapshot.image_url} alt={snapshot.reason ?? 'snapshot'} className="h-48 w-full object-cover" />
                    <div className="p-2 text-xs text-neutral-500">
                      {snapshot.reason ?? 'snapshot'} • {new Date(snapshot.created_at).toLocaleString()}
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-sm text-neutral-500">No snapshots captured.</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
