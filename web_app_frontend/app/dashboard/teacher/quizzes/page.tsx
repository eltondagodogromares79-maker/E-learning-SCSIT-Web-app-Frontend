'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useCreateQuiz } from '@/features/quizzes/hooks/useCreateQuiz';
import { useAiGenerateQuiz } from '@/features/quizzes/hooks/useAiGenerateQuiz';
import { useAiSaveQuiz } from '@/features/quizzes/hooks/useAiSaveQuiz';
import { useUpdateQuiz } from '@/features/quizzes/hooks/useUpdateQuiz';
import { useDeleteQuiz } from '@/features/quizzes/hooks/useDeleteQuiz';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

export default function TeacherQuizzesPage() {
  const { data: quizzes = [] } = useQuizzes();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const createQuiz = useCreateQuiz();
  const aiGenerateQuiz = useAiGenerateQuiz();
  const aiSaveQuiz = useAiSaveQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');
  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDueDate, setAiDueDate] = useState('');
  const [aiTimeLimit, setAiTimeLimit] = useState('');
  const [aiAttemptLimit, setAiAttemptLimit] = useState('1');
  const [aiDraftTitle, setAiDraftTitle] = useState('');
  const [aiDraftDescription, setAiDraftDescription] = useState('');
  const [aiDraftDueDate, setAiDraftDueDate] = useState('');
  const [aiDraftTimeLimit, setAiDraftTimeLimit] = useState('');
  const [aiDraftAttemptLimit, setAiDraftAttemptLimit] = useState('1');
  const [aiDraftAiGrade, setAiDraftAiGrade] = useState(true);
  const [aiSecurityLevel, setAiSecurityLevel] = useState<'normal' | 'strict'>('normal');
  const [aiDraftSecurityLevel, setAiDraftSecurityLevel] = useState<'normal' | 'strict'>('normal');
  const [aiDraftQuestions, setAiDraftQuestions] = useState<Array<Record<string, any>>>([]);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiIsAvailable, setAiIsAvailable] = useState(false);
  const [aiDraftIsAvailable, setAiDraftIsAvailable] = useState(false);

  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualDueDate, setManualDueDate] = useState('');
  const [manualTimeLimit, setManualTimeLimit] = useState('');
  const [manualAttemptLimit, setManualAttemptLimit] = useState('1');
  const [manualAiGrade, setManualAiGrade] = useState(true);
  const [manualSecurityLevel, setManualSecurityLevel] = useState<'normal' | 'strict'>('normal');
  const [manualIsAvailable, setManualIsAvailable] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editQuizId, setEditQuizId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState('');
  const [editAttemptLimit, setEditAttemptLimit] = useState('1');
  const [editAiGrade, setEditAiGrade] = useState(true);
  const [editSecurityLevel, setEditSecurityLevel] = useState<'normal' | 'strict'>('normal');
  const [editIsAvailable, setEditIsAvailable] = useState(false);

  useEffect(() => {
    if (sectionSubjectId) return;
    const fromUrl = searchParams.get('sectionSubjectId');
    if (fromUrl) {
      setSectionSubjectId(fromUrl);
    }
  }, [searchParams, sectionSubjectId]);

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

  const openEdit = (quiz: typeof quizzes[number]) => {
    setEditQuizId(quiz.id);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description ?? '');
    if (quiz.due_date) {
      const local = new Date(quiz.due_date);
      const pad = (val: number) => val.toString().padStart(2, '0');
      const formatted = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
      setEditDueDate(formatted);
    } else {
      setEditDueDate('');
    }
    setEditTimeLimit(quiz.time_limit_minutes ? String(quiz.time_limit_minutes) : '');
    setEditAttemptLimit(String(quiz.attempt_limit ?? 1));
    setEditAiGrade(Boolean(quiz.ai_grade_on_submit));
    setEditSecurityLevel((quiz.security_level as 'normal' | 'strict') ?? 'normal');
    setEditIsAvailable(Boolean(quiz.is_available));
    setEditOpen(true);
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
    const draft = await aiGenerateQuiz.mutateAsync({
      section_subject: sectionSubjectId,
      prompt: aiPrompt.trim(),
      due_date: dueDate,
      time_limit_minutes: aiTimeLimit ? Number(aiTimeLimit) : undefined,
      attempt_limit: aiAttemptLimit ? Number(aiAttemptLimit) : undefined,
      ai_grade_on_submit: aiDraftAiGrade,
      security_level: aiSecurityLevel,
      is_available: aiIsAvailable,
    });
    if (draft) {
      setAiDraftTitle(draft.title);
      setAiDraftDescription(draft.description);
      setAiDraftDueDate(draft.due_date);
      setAiDraftTimeLimit(draft.time_limit_minutes ? String(draft.time_limit_minutes) : '');
      setAiDraftAttemptLimit(String(draft.attempt_limit ?? 1));
      setAiDraftAiGrade(draft.ai_grade_on_submit ?? true);
      setAiDraftSecurityLevel((draft.security_level as 'normal' | 'strict') ?? aiSecurityLevel);
      setAiDraftIsAvailable(draft.is_available ?? aiIsAvailable);
      setAiDraftQuestions(draft.questions ?? []);
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
    await aiSaveQuiz.mutateAsync({
      section_subject: sectionSubjectId,
      title: aiDraftTitle.trim(),
      description: aiDraftDescription.trim(),
      due_date: dueDate,
      time_limit_minutes: aiDraftTimeLimit ? Number(aiDraftTimeLimit) : undefined,
      attempt_limit: aiDraftAttemptLimit ? Number(aiDraftAttemptLimit) : undefined,
      questions: aiDraftQuestions,
      ai_grade_on_submit: aiDraftAiGrade,
      security_level: aiDraftSecurityLevel,
      is_available: aiDraftIsAvailable,
    });
    setAiPreviewOpen(false);
    setAiDraftTitle('');
    setAiDraftDescription('');
    setAiDraftDueDate('');
    setAiDraftTimeLimit('');
    setAiDraftAttemptLimit('1');
    setAiDraftAiGrade(true);
    setAiDraftSecurityLevel('normal');
    setAiDraftIsAvailable(false);
    setAiDraftQuestions([]);
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
    await createQuiz.mutateAsync({
      section_subject: sectionSubjectId,
      title: manualTitle.trim(),
      description: manualDescription.trim(),
      total_points: 0,
      time_limit_minutes: manualTimeLimit ? Number(manualTimeLimit) : undefined,
      attempt_limit: Number(manualAttemptLimit) || 1,
      due_date: dueDate,
      ai_grade_on_submit: manualAiGrade,
      security_level: manualSecurityLevel,
      is_available: manualIsAvailable,
    });
    setManualTitle('');
    setManualDescription('');
    setManualSecurityLevel('normal');
    setManualIsAvailable(false);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Quizzes" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Quizzes"
          description="Create quizzes manually or let AI draft the questions."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
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
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            {createMode === 'ai' ? 'Generate a quiz with AI' : 'Create a quiz yourself'}
          </div>
        </div>

        {createMode === 'ai' ? (
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>AI quiz request</CardTitle>
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
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={aiTimeLimit}
                  onChange={(event) => setAiTimeLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                <Input
                  type="number"
                  min="1"
                  value={aiAttemptLimit}
                  onChange={(event) => setAiAttemptLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={aiDraftAiGrade ? 'yes' : 'no'}
                  onChange={(event) => setAiDraftAiGrade(event.target.value === 'yes')}
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={aiSecurityLevel}
                  onChange={(event) => setAiSecurityLevel(event.target.value as 'normal' | 'strict')}
                >
                  <option value="normal">Normal</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={aiIsAvailable ? 'yes' : 'no'}
                  onChange={(event) => setAiIsAvailable(event.target.value === 'yes')}
                >
                  <option value="no">Not available yet</option>
                  <option value="yes">Available to students</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  placeholder="Example: Create a 10-question biology quiz on cell division."
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleAiGenerate}
                  disabled={aiGenerateQuiz.isPending || !sectionSubjectId || !aiPrompt.trim()}
                >
                  {aiGenerateQuiz.isPending ? 'Generating…' : 'Generate quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {createMode === 'ai' ? (
          <Dialog open={aiPreviewOpen} onOpenChange={setAiPreviewOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>AI quiz preview</DialogTitle>
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
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                  <Input
                    type="number"
                    min="0"
                    value={aiDraftTimeLimit}
                    onChange={(event) => setAiDraftTimeLimit(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                  <Input
                    type="number"
                    min="1"
                    value={aiDraftAttemptLimit}
                    onChange={(event) => setAiDraftAttemptLimit(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={aiDraftAiGrade ? 'yes' : 'no'}
                    onChange={(event) => setAiDraftAiGrade(event.target.value === 'yes')}
                  >
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={aiDraftSecurityLevel}
                    onChange={(event) => setAiDraftSecurityLevel(event.target.value as 'normal' | 'strict')}
                  >
                    <option value="normal">Normal</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={aiDraftIsAvailable ? 'yes' : 'no'}
                    onChange={(event) => setAiDraftIsAvailable(event.target.value === 'yes')}
                  >
                    <option value="no">Not available yet</option>
                    <option value="yes">Available to students</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Questions</label>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700">
                    {aiDraftQuestions.length === 0 ? (
                      <div className="text-xs text-neutral-500">No questions generated yet.</div>
                    ) : (
                      aiDraftQuestions.map((question, index) => (
                        <div key={index} className="border-b border-neutral-100 pb-2">
                          <div className="font-semibold">Q{index + 1}: {question.question_text || question.question}</div>
                          <div className="text-xs text-neutral-500">
                            {question.question_type || 'multiple_choice'} • {question.points ?? 1} pts
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAiSave} disabled={aiSaveQuiz.isPending || !aiDraftTitle.trim()}>
                  {aiSaveQuiz.isPending ? 'Saving…' : 'Save quiz'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiPreviewOpen(false);
                    setAiDraftTitle('');
                    setAiDraftDescription('');
                    setAiDraftDueDate('');
                    setAiDraftTimeLimit('');
                    setAiDraftAttemptLimit('1');
                    setAiDraftIsAvailable(false);
                    setAiDraftQuestions([]);
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
              <CardTitle>Manual quiz</CardTitle>
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
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={manualTimeLimit}
                  onChange={(event) => setManualTimeLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                <Input
                  type="number"
                  min="1"
                  value={manualAttemptLimit}
                  onChange={(event) => setManualAttemptLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={manualAiGrade ? 'yes' : 'no'}
                  onChange={(event) => setManualAiGrade(event.target.value === 'yes')}
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={manualSecurityLevel}
                  onChange={(event) => setManualSecurityLevel(event.target.value as 'normal' | 'strict')}
                >
                  <option value="normal">Normal</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={manualIsAvailable ? 'yes' : 'no'}
                  onChange={(event) => setManualIsAvailable(event.target.value === 'yes')}
                >
                  <option value="no">Not available yet</option>
                  <option value="yes">Available to students</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleManualSave}
                  disabled={createQuiz.isPending || !sectionSubjectId || !manualTitle.trim()}
                >
                  {createQuiz.isPending ? 'Saving…' : 'Save quiz'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Recent quizzes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quizzes.length === 0 ? (
              <div className="text-sm text-neutral-500">No quizzes yet.</div>
            ) : (
              quizzes.slice(0, 6).map((quiz) => (
                <div
                  key={quiz.id}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.3)] hover:bg-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{quiz.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Due {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{quiz.attempt_limit} attempts</Badge>
                      {quiz.is_available === false ? <Badge variant="outline">Not available</Badge> : <Badge>Available</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id}`}
                      className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                    >
                      Manage questions
                    </Link>
                    <Link
                      href={`/dashboard/teacher/quizzes/${quiz.id}/submissions`}
                      className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                    >
                      View submissions
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(quiz)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete quiz?',
                          description: 'This will remove the quiz and all attempts.',
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                        });
                        if (!ok) return;
                        await deleteQuiz.mutateAsync(quiz.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit quiz</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                <Input
                  type="datetime-local"
                  min={nowLocal()}
                  value={editDueDate}
                  onChange={(event) => setEditDueDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={editTimeLimit}
                  onChange={(event) => setEditTimeLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                <Input
                  type="number"
                  min="1"
                  value={editAttemptLimit}
                  onChange={(event) => setEditAttemptLimit(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={editAiGrade ? 'yes' : 'no'}
                  onChange={(event) => setEditAiGrade(event.target.value === 'yes')}
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={editSecurityLevel}
                  onChange={(event) => setEditSecurityLevel(event.target.value as 'normal' | 'strict')}
                >
                  <option value="normal">Normal</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={editIsAvailable ? 'yes' : 'no'}
                  onChange={(event) => setEditIsAvailable(event.target.value === 'yes')}
                >
                  <option value="no">Not available yet</option>
                  <option value="yes">Available to students</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editQuizId) return;
                  if (editDueDate && isPastDate(editDueDate)) {
                    showToast({ title: 'Invalid date', description: 'Due date must be today or in the future.', variant: 'error' });
                    return;
                  }
                  await updateQuiz.mutateAsync({
                    id: editQuizId,
                    data: {
                      title: editTitle.trim(),
                      description: editDescription.trim(),
                      due_date: editDueDate ? toIso(editDueDate) : undefined,
                      time_limit_minutes: editTimeLimit ? Number(editTimeLimit) : undefined,
                      attempt_limit: Number(editAttemptLimit) || 1,
                      ai_grade_on_submit: editAiGrade,
                      security_level: editSecurityLevel,
                      is_available: editIsAvailable,
                    },
                  });
                  setEditOpen(false);
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
