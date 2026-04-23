'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useCreateAttendanceSession } from '@/features/attendance/hooks/useCreateAttendanceSession';
import { useEndAttendanceSession } from '@/features/attendance/hooks/useEndAttendanceSession';
import { useStartAttendanceSession } from '@/features/attendance/hooks/useStartAttendanceSession';
import { useUpdateAttendanceSession } from '@/features/attendance/hooks/useUpdateAttendanceSession';
import { useDeleteAttendanceSession } from '@/features/attendance/hooks/useDeleteAttendanceSession';
import { useConfirm } from '@/components/ui/confirm';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Search, Clock, Users, Play, Square, Pencil, Trash2, Plus } from 'lucide-react';

const stateStyle = {
  live:     { color: '#059669', light: 'rgba(5,150,105,0.1)',   label: 'Live'     },
  upcoming: { color: '#0891b2', light: 'rgba(8,145,178,0.1)',   label: 'Upcoming' },
  ended:    { color: '#6b7280', light: 'rgba(107,114,128,0.1)', label: 'Ended'    },
};

export default function TeacherOnlineClassesPage() {
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const createSession = useCreateAttendanceSession();
  const endSession = useEndAttendanceSession();
  const startSession = useStartAttendanceSession();
  const updateSession = useUpdateAttendanceSession();
  const deleteSession = useDeleteAttendanceSession();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const nowLocal = () => new Date().toISOString().slice(0, 16);
  const isPastDate = (v?: string) => { if (!v) return false; const d = new Date(v); return isNaN(d.getTime()) || d.getTime() < Date.now(); };

  const { data: sessions = [] } = useAttendanceSessions(sectionSubjectId ? { section_subject: sectionSubjectId } : undefined);
  const onlineSessions = useMemo(() => sessions.filter((s) => s.is_online_class), [sessions]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return onlineSessions;
    return onlineSessions.filter((s) => [s.title, s.section_name, s.subject_name, s.subject_code].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [onlineSessions, query]);

  const counts = useMemo(() => {
    const c = { live: 0, upcoming: 0, ended: 0 };
    onlineSessions.forEach((s) => {
      if (s.ended_at) c.ended++;
      else if (s.is_live) c.live++;
      else c.upcoming++;
    });
    return c;
  }, [onlineSessions]);

  const openEdit = (session: { id: string; title?: string | null; scheduled_at: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title ?? '');
    const d = new Date(session.scheduled_at);
    const pad = (v: number) => v.toString().padStart(2, '0');
    setEditScheduledAt(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setEditOpen(true);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Online Classes" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Video className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Online Classes</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Live Classes</h1>
              <p className="mt-2 text-sm text-white/70">{onlineSessions.length} total session{onlineSessions.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[{ label: 'Live', value: counts.live }, { label: 'Upcoming', value: counts.upcoming }, { label: 'Ended', value: counts.ended }].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <div><div className="text-lg font-bold leading-none text-white">{s.value}</div><div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{s.label}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Create form ── */}
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
            <Plus className="h-4 w-4" style={{ color: 'var(--brand-blue)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Create Online Class</h2>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>— Students will be notified automatically.</span>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Class</label>
              <select className="h-10 w-full rounded-xl border px-3 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)' }}
                value={sectionSubjectId} onChange={(e) => setSectionSubjectId(e.target.value)}>
                <option value="">Select a class</option>
                {sectionSubjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name} — {s.section_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Online class" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Date & Time</label>
              <Input type="datetime-local" min={nowLocal()} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button disabled={!sectionSubjectId || !scheduledAt || createSession.isPending}
                onClick={() => {
                  if (!sectionSubjectId || !scheduledAt) return;
                  if (isPastDate(scheduledAt)) { showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' }); return; }
                  createSession.mutate({ section_subject: sectionSubjectId, title: title.trim() || undefined, scheduled_at: new Date(scheduledAt).toISOString(), is_online_class: true });
                  setTitle(''); setScheduledAt('');
                }}>
                {createSession.isPending ? 'Creating…' : 'Create Online Class'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sessions…"
              className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }} />
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{filtered.length} session{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Session cards ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <Video className="h-8 w-8 opacity-30" />
            <p className="text-sm">{query.trim() ? `No sessions found for "${query}".` : 'No online classes yet.'}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((session) => {
              const state = session.ended_at ? 'ended' : session.is_live ? 'live' : 'upcoming';
              const style = stateStyle[state];
              return (
                <motion.div key={session.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                  <div className="flex flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="h-1.5 w-full" style={{ background: style.color }} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                            {session.subject_name ?? session.section_name ?? 'Class'}
                          </p>
                          <h3 className="mt-1 text-base font-bold" style={{ color: 'var(--foreground)' }}>{session.title || 'Online Class'}</h3>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: style.light, color: style.color }}>
                          {state === 'live' && <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: style.color }} /><span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: style.color }} /></span>}
                          {style.label}
                        </span>
                      </div>
                      <div className="mb-4 flex flex-wrap gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{(session.present_count ?? 0) + (session.late_count ?? 0)} / {session.total_count ?? 0} joined</span>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button size="sm" disabled={startSession.isPending || Boolean(session.ended_at) || session.is_live}
                          className="flex items-center gap-1.5"
                          style={state === 'upcoming' ? { background: 'var(--brand-blue)', color: '#fff' } : {}}
                          onClick={async () => {
                            try { const r = await startSession.mutateAsync(session.id); const url = r?.join_url ?? session.join_url; if (url) window.open(url, '_blank'); } catch {}
                          }}>
                          <Play className="h-3.5 w-3.5" />
                          {session.ended_at ? 'Ended' : session.is_live ? 'Live' : startSession.isPending ? 'Starting…' : 'Start'}
                        </Button>
                        {session.join_url && session.is_live && (
                          <Button size="sm" variant="outline" onClick={() => window.open(session.join_url ?? '', '_blank')}>Open Link</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openEdit(session)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" disabled={endSession.isPending || Boolean(session.ended_at)}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={() => endSession.mutate(session.id)}>
                          <Square className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" disabled={deleteSession.isPending}
                          onClick={async () => {
                            const ok = await confirm({ title: 'Delete class', description: 'Remove this session? This cannot be undone.', danger: true });
                            if (ok) deleteSession.mutate(session.id);
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Online Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Date & Time</label>
              <Input type="datetime-local" min={nowLocal()} value={editScheduledAt} onChange={(e) => setEditScheduledAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={!editingId || updateSession.isPending}
              onClick={async () => {
                if (!editingId || !editScheduledAt) return;
                if (isPastDate(editScheduledAt)) { showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' }); return; }
                await updateSession.mutateAsync({ sessionId: editingId, payload: { title: editTitle.trim() || undefined, scheduled_at: new Date(editScheduledAt).toISOString() } });
                setEditOpen(false);
              }}>
              {updateSession.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
