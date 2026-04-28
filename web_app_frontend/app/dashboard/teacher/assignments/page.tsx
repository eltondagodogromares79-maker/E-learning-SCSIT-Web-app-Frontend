'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { TeacherCardGridSkeleton } from '@/components/layout/TeacherListSkeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { ClipboardList } from 'lucide-react';
import { useCreateAssignment } from '@/features/assignments/hooks/useCreateAssignment';
import { useAiGenerateAssignment } from '@/features/assignments/hooks/useAiGenerateAssignment';
import { useAiSaveAssignment } from '@/features/assignments/hooks/useAiSaveAssignment';
import { useDeleteAssignment } from '@/features/assignments/hooks/useDeleteAssignment';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

function TeacherAssignmentsPageInner() {
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const createAssignment = useCreateAssignment();
  const aiGenerateAssignment = useAiGenerateAssignment();
  const aiSaveAssignment = useAiSaveAssignment();
  const deleteAssignment = useDeleteAssignment();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const showAssignmentsSkeleton = useReliableSkeleton(assignmentsLoading);

  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('manual');
  const [sectionSubjectId, setSectionSubjectId] = useState(() => searchParams.get('sectionSubjectId') ?? '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDueDate, setAiDueDate] = useState('');
  const [aiTotalPoints, setAiTotalPoints] = useState('100');
  const [aiAllowLate, setAiAllowLate] = useState(false);
  const [aiDraftTitle, setAiDraftTitle] = useState('');
  const [aiDraftDescription, setAiDraftDescription] = useState('');
  const [aiDraftDueDate, setAiDraftDueDate] = useState('');
  const [aiDraftTotalPoints, setAiDraftTotalPoints] = useState('100');
  const [aiDraftAllowLate, setAiDraftAllowLate] = useState(false);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);

  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualTotalPoints, setManualTotalPoints] = useState('100');
  const [manualAllowLate, setManualAllowLate] = useState(false);

  const toIso = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
  };

  const nowLocal = () => new Date().toISOString().slice(0, 16);
  const isPastDate = (value?: string) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;
    return date.getTime() < Date.now();
  };

  const handleAiGenerate = async () => {
    if (!sectionSubjectId || !aiPrompt.trim()) return;
    const dueDate = aiDueDate ? toIso(aiDueDate) : undefined;
    if (aiDueDate && !dueDate) {
      showToast({ title: 'Invalid date', description: 'Please provide a valid due date.', variant: 'error' });
      return;
    }
    if (aiDueDate && isPastDate(aiDueDate)) {
      showToast({ title: 'Invalid date', description: 'Due date must be today or in the future.', variant: 'error' });
      return;
    }
    const draft = await aiGenerateAssignment.mutateAsync({
      section_subject: sectionSubjectId,
      prompt: aiPrompt.trim(),
      due_date: dueDate,
      total_points: Number(aiTotalPoints) || 100,
      allow_late_submission: aiAllowLate,
    });
    if (draft) {
      setAiDraftTitle(draft.title);
      setAiDraftDescription(draft.description);
      setAiDraftDueDate(draft.due_date);
      setAiDraftTotalPoints(String(draft.total_points ?? 100));
      setAiDraftAllowLate(Boolean(draft.allow_late_submission));
      setAiPreviewOpen(true);
    }
    setAiPrompt('');
  };

  const handleAiSave = async () => {
    if (!sectionSubjectId || !aiDraftTitle.trim()) return;
    const dueDate = aiDraftDueDate ? toIso(aiDraftDueDate) : undefined;
    if (aiDraftDueDate && !dueDate) {
      showToast({ title: 'Invalid date', description: 'Please provide a valid due date.', variant: 'error' });
      return;
    }
    if (aiDraftDueDate && isPastDate(aiDraftDueDate)) {
      showToast({ title: 'Invalid date', description: 'Due date must be today or in the future.', variant: 'error' });
      return;
    }
    await aiSaveAssignment.mutateAsync({
      section_subject: sectionSubjectId,
      title: aiDraftTitle.trim(),
      description: aiDraftDescription.trim(),
      total_points: Number(aiDraftTotalPoints) || 100,
      due_date: dueDate,
      allow_late_submission: aiDraftAllowLate,
    });
    setAiPreviewOpen(false);
    setAiDraftTitle('');
    setAiDraftDescription('');
    setAiDraftDueDate('');
    setAiDraftTotalPoints('100');
    setAiDraftAllowLate(false);
  };

  const handleManualSave = async () => {
    if (!sectionSubjectId || !manualTitle.trim()) return;
    const dueDate = toIso(manualDueDate);
    if (!dueDate) {
      showToast({ title: 'Due date required', description: 'Please set a due date.', variant: 'error' });
      return;
    }
    if (isPastDate(manualDueDate)) {
      showToast({ title: 'Invalid date', description: 'Due date must be today or in the future.', variant: 'error' });
      return;
    }
    await createAssignment.mutateAsync({
      section_subject: sectionSubjectId,
      title: manualTitle.trim(),
      description: manualDescription.trim(),
      total_points: Number(manualTotalPoints) || 100,
      due_date: dueDate,
      allow_late_submission: manualAllowLate,
    });
    setManualTitle('');
    setManualDescription('');
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Assignments" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Assignments</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Assignments</h1>
            <p className="mt-2 text-sm text-white/70">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · AI or manual creation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCreateMode('manual')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                createMode === 'manual'
                  ? 'bg-[var(--brand-blue-deep)] text-white shadow'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('ai')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                createMode === 'ai'
                  ? 'bg-[var(--brand-blue-deep)] text-white shadow'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              AI Draft
            </button>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            {createMode === 'ai' ? 'Generate an assignment with AI' : 'Create an assignment yourself'}
          </div>
        </div>

        {createMode === 'ai' ? (
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>AI assignment request</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Section subject</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={sectionSubjectId}
                  onChange={(event) => setSectionSubjectId(event.target.value)}
                >
                  <option value="">Select subject</option>
                  {sectionSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.subject_name} • {item.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                <Input
                  type="datetime-local"
                  min={nowLocal()}
                  value={aiDueDate}
                  onChange={(event) => setAiDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                <Input
                  type="number"
                  min="0"
                  value={aiTotalPoints}
                  onChange={(event) => setAiTotalPoints(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={aiAllowLate}
                  onChange={(event) => setAiAllowLate(event.target.checked)}
                />
                Allow late submissions
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  placeholder="Example: Create a Grade 10 physics assignment on Newton's laws with 5 problems."
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleAiGenerate}
                  disabled={aiGenerateAssignment.isPending || !sectionSubjectId || !aiPrompt.trim()}
                >
                  {aiGenerateAssignment.isPending ? 'Generating…' : 'Generate assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {createMode === 'ai' ? (
          <Dialog open={aiPreviewOpen} onOpenChange={setAiPreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI assignment preview</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                  <Input value={aiDraftTitle} onChange={(event) => setAiDraftTitle(event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                  <textarea
                    rows={6}
                    className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                    value={aiDraftDescription}
                    onChange={(event) => setAiDraftDescription(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                  <Input
                    type="datetime-local"
                    min={nowLocal()}
                    value={aiDraftDueDate}
                    onChange={(event) => setAiDraftDueDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                  <Input
                    type="number"
                    min="0"
                    value={aiDraftTotalPoints}
                    onChange={(event) => setAiDraftTotalPoints(event.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={aiDraftAllowLate}
                    onChange={(event) => setAiDraftAllowLate(event.target.checked)}
                  />
                  Allow late submissions
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAiSave} disabled={aiSaveAssignment.isPending || !aiDraftTitle.trim()}>
                  {aiSaveAssignment.isPending ? 'Saving…' : 'Save assignment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiPreviewOpen(false);
                    setAiDraftTitle('');
                    setAiDraftDescription('');
                    setAiDraftDueDate('');
                    setAiDraftTotalPoints('100');
                    setAiDraftAllowLate(false);
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}

        {createMode === 'manual' ? (
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Manual assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Section subject</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={sectionSubjectId}
                  onChange={(event) => setSectionSubjectId(event.target.value)}
                >
                  <option value="">Select subject</option>
                  {sectionSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.subject_name} • {item.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                <Input
                  type="datetime-local"
                  min={nowLocal()}
                  value={manualDueDate}
                  onChange={(event) => setManualDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                <Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  value={manualDescription}
                  onChange={(event) => setManualDescription(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                <Input
                  type="number"
                  min="0"
                  value={manualTotalPoints}
                  onChange={(event) => setManualTotalPoints(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={manualAllowLate}
                  onChange={(event) => setManualAllowLate(event.target.checked)}
                />
                Allow late submissions
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleManualSave}
                  disabled={createAssignment.isPending || !sectionSubjectId || !manualTitle.trim()}
                >
                  {createAssignment.isPending ? 'Saving…' : 'Save assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {showAssignmentsSkeleton ? (
            <div className="col-span-full">
              <TeacherCardGridSkeleton count={4} columnsClass="md:grid-cols-2" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-500 shadow-sm">
              No assignments found.
            </div>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-neutral-900">{assignment.title}</CardTitle>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {assignment.subject_name ?? 'Subject'}
                    </div>
                  </div>
                  <Badge variant="outline">Due {new Date(assignment.due_date).toLocaleDateString()}</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-neutral-500">
                  <div>Total points: {assignment.total_points}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button as={Link} href={`/dashboard/teacher/assignments/${assignment.id}`} size="sm" variant="outline">
                      View submissions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="border border-red-900 bg-red-700 text-white hover:bg-red-800"
                      style={{ background: '#dc2626', borderColor: '#991b1b', color: '#fff' }}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete assignment?',
                          description: 'This will remove the assignment and its submissions.',
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                          danger: true,
                        });
                        if (!ok) return;
                        await deleteAssignment.mutateAsync(assignment.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function TeacherAssignmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <TeacherAssignmentsPageInner />
    </Suspense>
  );
}
