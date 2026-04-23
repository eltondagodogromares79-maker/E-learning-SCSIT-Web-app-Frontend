'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useQuizzes } from '@/features/quizzes/hooks/useQuizzes';
import { useUpdateLesson } from '@/features/lessons/hooks/useUpdateLesson';
import { useDeleteLesson } from '@/features/lessons/hooks/useDeleteLesson';
import { useUpdateAssignment } from '@/features/assignments/hooks/useUpdateAssignment';
import { useDeleteAssignment } from '@/features/assignments/hooks/useDeleteAssignment';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useGradeSubmission } from '@/features/assignments/hooks/useGradeSubmission';
import { useAiGradeSubmission } from '@/features/assignments/hooks/useAiGradeSubmission';
import { assignmentService } from '@/features/assignments/services/assignmentService';
import { useUpdateQuiz } from '@/features/quizzes/hooks/useUpdateQuiz';
import { useDeleteQuiz } from '@/features/quizzes/hooks/useDeleteQuiz';
import { useQuizAttempts } from '@/features/quizzes/hooks/useQuizAttempts';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { quizService } from '@/features/quizzes/services/quizService';
import { useAttendanceSessions } from '@/features/attendance/hooks/useAttendanceSessions';
import { useAttendanceRecords } from '@/features/attendance/hooks/useAttendanceRecords';
import { useCreateAttendanceSession } from '@/features/attendance/hooks/useCreateAttendanceSession';
import { useMarkAttendance } from '@/features/attendance/hooks/useMarkAttendance';
import { useEndAttendanceSession } from '@/features/attendance/hooks/useEndAttendanceSession';
import { useStartAttendanceSession } from '@/features/attendance/hooks/useStartAttendanceSession';
import { useUpdateAttendanceSession } from '@/features/attendance/hooks/useUpdateAttendanceSession';
import { useDeleteAttendanceSession } from '@/features/attendance/hooks/useDeleteAttendanceSession';
import { useToast } from '@/components/ui/toast';
import { env } from '@/lib/env';
import { useConfirm } from '@/components/ui/confirm';
import type { QuizProctorLog } from '@/types';
import { useStudentPerformance } from '@/features/dashboard/hooks/useStudentPerformance';
import { useCreateLesson } from '@/features/lessons/hooks/useCreateLesson';
import { useAiGenerateLesson } from '@/features/lessons/hooks/useAiGenerateLesson';
import { useAiSaveLesson } from '@/features/lessons/hooks/useAiSaveLesson';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useCreateAssignment } from '@/features/assignments/hooks/useCreateAssignment';
import { useAiGenerateAssignment } from '@/features/assignments/hooks/useAiGenerateAssignment';
import { useAiSaveAssignment } from '@/features/assignments/hooks/useAiSaveAssignment';
import { useCreateQuiz } from '@/features/quizzes/hooks/useCreateQuiz';
import { useAiGenerateQuiz } from '@/features/quizzes/hooks/useAiGenerateQuiz';
import { useAiSaveQuiz } from '@/features/quizzes/hooks/useAiSaveQuiz';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, BookOpen, ExternalLink, ArrowLeft, ClipboardList, Search, Trophy, Star, Video, Clock, Users, Play, Square, Pencil, Trash2 } from 'lucide-react';

type TabKey = 'students' | 'lessons' | 'assignments' | 'quizzes' | 'attendance';

const toIso = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const nowLocal = () => new Date().toISOString().slice(0, 16);
const nowDate = () => new Date().toISOString().slice(0, 10);
const isPastDate = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < Date.now();
};
const isPastDateOnly = (value?: string) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

function studentInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

type DraftMap = Record<string, { score: string; feedback: string }>;

function assignmentInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function assignmentAvatarColor(name: string) {
  const palette = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return palette[name.charCodeAt(0) % palette.length];
}

function QuizInlineView({ quizId, quizzes, onBack }: { quizId: string; quizzes: any[]; onBack: () => void }) {
  const quiz = quizzes.find((q) => q.id === quizId);
  const [view, setView] = useState<'detail' | 'questions'>('detail');

  // question manager state
  const { data: quizDetail, refetch } = useQuiz(quizId);
  const { showToast } = useToast();
  type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'identification';
  type EditableChoice = { id?: string; text: string; is_correct: boolean; removed?: boolean };
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [points, setPoints] = useState('1');
  const [choices, setChoices] = useState([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPoints, setEditingPoints] = useState('1');
  const [editingType, setEditingType] = useState<QuestionType>('multiple_choice');
  const [editingChoices, setEditingChoices] = useState<EditableChoice[]>([]);
  const [ordering, setOrdering] = useState<string[]>([]);

  const editingQuestion = useMemo(
    () => quizDetail?.questions?.find((q) => q.id === editingId),
    [quizDetail?.questions, editingId]
  );

  useEffect(() => { if (questionType === 'true_false') setChoices([{ text: 'True', is_correct: true }, { text: 'False', is_correct: false }]); }, [questionType]);
  useEffect(() => { if (editingId && editingType === 'true_false') setEditingChoices([{ text: 'True', is_correct: true }, { text: 'False', is_correct: false }]); }, [editingId, editingType]);

  const beginEdit = (q: any) => {
    setEditingId(q.id); setEditingText(q.question_text); setEditingPoints(String(q.points)); setEditingType(q.question_type);
    setEditingChoices((q.choices ?? []).map((c: any) => ({ id: c.id, text: c.choice_text, is_correct: c.is_correct })));
  };
  const cancelEdit = () => { setEditingId(null); setEditingText(''); setEditingPoints('1'); setEditingType('multiple_choice'); setEditingChoices([]); };

  const saveEdit = async () => {
    if (!editingId) return;
    const shouldHaveChoices = editingType === 'multiple_choice' || editingType === 'true_false';
    if (shouldHaveChoices && !editingChoices.some((c) => !c.removed && c.is_correct)) {
      showToast({ title: 'Correct answer required', description: 'Select the correct answer.', variant: 'error' }); return;
    }
    await quizService.updateQuestion(editingId, { question_text: editingText.trim(), points: Number(editingPoints) || 1, question_type: editingType });
    if (!shouldHaveChoices) {
      for (const c of (editingQuestion?.choices ?? [])) await quizService.deleteChoice(c.id);
    } else {
      for (const c of editingChoices) {
        if (c.removed) { if (c.id) await quizService.deleteChoice(c.id); continue; }
        if (!c.text.trim()) continue;
        if (c.id) await quizService.updateChoice(c.id, { choice_text: c.text.trim(), is_correct: c.is_correct });
        else await quizService.createChoice({ question: editingId, choice_text: c.text.trim(), is_correct: c.is_correct });
      }
    }
    await refetch(); cancelEdit();
  };

  const handleSaveQuestion = async () => {
    if (!quizDetail) return;
    if (!questionText.trim()) { showToast({ title: 'Question required', description: 'Enter the question text.', variant: 'error' }); return; }
    if ((questionType === 'multiple_choice' || questionType === 'true_false') && !choices.some((c) => c.is_correct)) {
      showToast({ title: 'Correct answer required', description: 'Select the correct answer.', variant: 'error' }); return;
    }
    setSaving(true);
    try {
      const question = await quizService.createQuestion({ quiz: quizDetail.id, question_text: questionText.trim(), question_type: questionType, points: Number(points) || 1 });
      if (questionType === 'multiple_choice' || questionType === 'true_false') {
        for (const c of choices.filter((c) => c.text.trim())) await quizService.createChoice({ question: question.id, choice_text: c.text.trim(), is_correct: c.is_correct });
      }
      await refetch();
      setQuestionText(''); setPoints('1'); setQuestionType('multiple_choice'); setChoices([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
      showToast({ title: 'Question added', variant: 'success' });
    } catch (err: any) {
      showToast({ title: 'Save failed', description: err?.message ?? 'Unable to add question.', variant: 'error' });
    } finally { setSaving(false); }
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    setOrdering((prev) => {
      const base = prev.length ? prev : (quizDetail?.questions?.map((q) => q.id) ?? []);
      const idx = base.indexOf(id); if (idx < 0) return base;
      const next = [...base]; const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= next.length) return base;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]; return next;
    });
  };

  if (!quiz) return <div className="py-8 text-center text-sm text-neutral-400">Quiz not found.</div>;

  // ── Question manager view ──
  if (view === 'questions') {
    const orderedQuestions = ordering.length
      ? ordering.map((id) => quizDetail?.questions?.find((q) => q.id === id)).filter(Boolean)
      : (quizDetail?.questions ?? []);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setView('detail')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to quiz
          </Button>
          <div>
            <div className="text-base font-bold text-neutral-900">{quiz.title}</div>
            <div className="text-xs text-neutral-400">Manage questions</div>
          </div>
        </div>

        {/* Add question */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader><CardTitle>Add question</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question</label>
              <textarea className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white p-3 text-sm" rows={3}
                value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)}>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="essay">Essay</option>
                  <option value="identification">Identification</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Points</label>
                <Input type="number" min="1" value={points} onChange={(e) => setPoints(e.target.value)} />
              </div>
            </div>
            {(questionType === 'multiple_choice' || questionType === 'true_false') && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Choices</label>
                <div className="space-y-2">
                  {choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct-choice" checked={choice.is_correct}
                        onChange={() => setChoices((prev) => prev.map((c, idx) => ({ ...c, is_correct: idx === i })))} />
                      <Input value={choice.text} readOnly={questionType === 'true_false'} placeholder={`Choice ${i + 1}`}
                        onChange={(e) => setChoices((prev) => prev.map((c, idx) => idx === i ? { ...c, text: e.target.value } : c))} />
                    </div>
                  ))}
                </div>
                {questionType === 'multiple_choice' && (
                  <Button variant="secondary" onClick={() => setChoices((prev) => [...prev, { text: '', is_correct: false }])}>Add choice</Button>
                )}
              </div>
            )}
            <Button onClick={handleSaveQuestion} disabled={saving}>{saving ? 'Saving…' : 'Save question'}</Button>
          </CardContent>
        </Card>

        {/* Questions list */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader><CardTitle>Questions ({orderedQuestions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {orderedQuestions.length === 0 ? (
              <div className="text-sm text-neutral-500">No questions yet.</div>
            ) : orderedQuestions.map((q, i) => (
              <div key={q!.id} className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-4">
                {editingId === q!.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question</label>
                      <textarea className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white p-3 text-sm" rows={3}
                        value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                        <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                          value={editingType} onChange={(e) => setEditingType(e.target.value as QuestionType)}>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="essay">Essay</option>
                          <option value="identification">Identification</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Points</label>
                        <Input type="number" min="1" value={editingPoints} onChange={(e) => setEditingPoints(e.target.value)} />
                      </div>
                    </div>
                    {(editingType === 'multiple_choice' || editingType === 'true_false') && (
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Choices</label>
                        <div className="space-y-2">
                          {editingChoices.map((c, idx) => c.removed ? null : (
                            <div key={c.id ?? idx} className="flex items-center gap-2">
                              <input type="radio" name="edit-correct-choice" checked={c.is_correct}
                                onChange={() => setEditingChoices((prev) => prev.map((item, j) => ({ ...item, is_correct: j === idx })))} />
                              <Input value={c.text} readOnly={editingType === 'true_false'} placeholder={`Choice ${idx + 1}`}
                                onChange={(e) => setEditingChoices((prev) => prev.map((item, j) => j === idx ? { ...item, text: e.target.value } : item))} />
                              {editingType === 'multiple_choice' && (
                                <Button variant="destructive" size="sm" onClick={() => setEditingChoices((prev) => {
                                  const target = prev[idx]; if (!target) return prev;
                                  if (target.id) return prev.map((item, j) => j === idx ? { ...item, removed: true } : item);
                                  return prev.filter((_, j) => j !== idx);
                                })}>Remove</Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editingType === 'multiple_choice' && (
                          <Button variant="secondary" onClick={() => setEditingChoices((prev) => [...prev, { text: '', is_correct: false }])}>Add choice</Button>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={saveEdit}>Save</Button>
                      <Button variant="secondary" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question {i + 1}</div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => moveQuestion(q!.id, -1)}>↑</Button>
                        <Button variant="secondary" size="sm" onClick={() => moveQuestion(q!.id, 1)}>↓</Button>
                        <Button variant="outline" size="sm" onClick={() => beginEdit(q!)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={async () => { await quizService.deleteQuestion(q!.id); await refetch(); }}>Delete</Button>
                      </div>
                    </div>
                    <div className="mt-1 font-semibold text-neutral-900">{q!.question_text}</div>
                    <div className="mt-1 text-xs text-neutral-500">{q!.question_type} • {q!.points} pts</div>
                    {q!.choices?.length ? (
                      <ul className="mt-2 list-disc pl-4 text-xs text-neutral-600">
                        {q!.choices.map((c: any) => <li key={c.id}>{c.choice_text} {c.is_correct ? '(correct)' : ''}</li>)}
                      </ul>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Detail / submissions view ──
  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--brand-blue)' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white opacity-5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Quiz</span>
              {quiz.is_available === false
                ? <Badge className="border-white/30 bg-white/15 text-white text-[10px] uppercase tracking-widest">Not available</Badge>
                : <Badge className="border-white/30 bg-white/15 text-white text-[10px] uppercase tracking-widest">Available</Badge>}
            </div>
            <h2 className="text-2xl font-bold text-white">{quiz.title}</h2>
            {quiz.description && <p className="mt-1 text-sm text-white/70">{quiz.description}</p>}
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/50">Due</div>
                <div className="font-semibold text-white">{quiz.due_date ? new Date(quiz.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* meta row */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-xs text-neutral-600 shadow-sm">
          ⏱ {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min limit` : 'No time limit'}
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-xs text-neutral-600 shadow-sm">
          🔄 {quiz.attempt_limit} attempt{quiz.attempt_limit !== 1 ? 's' : ''}
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-xs text-neutral-600 shadow-sm">
          🔒 Security: strict
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-xs text-neutral-600 shadow-sm">
          ✨ AI grade: {quiz.ai_grade_on_submit ? 'enabled' : 'disabled'}
        </div>
        <div className="ml-auto">
          <button type="button" onClick={() => setView('questions')}
            className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
            Manage questions
          </button>
        </div>
      </div>

      {/* attempts */}
      <Card className="border border-neutral-200/80 shadow-sm">
        <CardContent className="p-5">
          <div className="text-sm font-semibold text-neutral-700 mb-1">Submissions</div>
          <QuizAttemptsPanel quizId={quizId} />
        </CardContent>
      </Card>

      <Button variant="secondary" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Button>
    </div>
  );
}

function AssignmentInlineView({
  assignmentId, assignments, submissions, gradeSubmission, aiGradeSubmission, onBack,
}: {
  assignmentId: string;
  assignments: any[];
  submissions: any[];
  gradeSubmission: any;
  aiGradeSubmission: any;
  onBack: () => void;
}) {
  const assignment = assignments.find((a) => a.id === assignmentId);
  const filteredSubmissions = submissions.filter((s) => s.assignment_id === assignmentId);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [timelinessFilter, setTimelinessFilter] = useState<'all' | 'late' | 'on_time'>('all');
  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | null>(null);

  const getDraft = (id: string) => drafts[id] ?? { score: '', feedback: '' };
  const setDraft = (id: string, patch: Partial<DraftMap[string]>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...getDraft(id), ...patch } }));

  const getStatus = (submittedAt?: string) => {
    if (!submittedAt || !assignment) return { label: 'Pending', color: 'bg-neutral-100 text-neutral-600' };
    const due = new Date(assignment.due_date);
    const submitted = new Date(submittedAt);
    if (!Number.isNaN(due.getTime()) && !Number.isNaN(submitted.getTime()) && submitted > due)
      return { label: 'Late', color: 'bg-rose-100 text-rose-700' };
    return { label: 'On time', color: 'bg-emerald-100 text-emerald-700' };
  };

  const gradedSubmissions = filteredSubmissions.filter((s) => s.score !== undefined && s.score !== null);
  const topRankings = useMemo(
    () => [...gradedSubmissions].filter((s) => typeof s.score === 'number').sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5),
    [gradedSubmissions]
  );

  const loweredSearch = submissionSearch.trim().toLowerCase();
  const filteredByScore =
    submissionFilter === 'graded' ? gradedSubmissions
    : submissionFilter === 'ungraded' ? filteredSubmissions.filter((s) => s.score === undefined || s.score === null)
    : filteredSubmissions;
  const filteredByTime =
    timelinessFilter === 'late'
      ? filteredByScore.filter((s) => { if (!assignment?.due_date) return false; const sub = new Date(s.submitted_at); const due = new Date(assignment.due_date); return !Number.isNaN(sub.getTime()) && !Number.isNaN(due.getTime()) && sub > due; })
    : timelinessFilter === 'on_time'
      ? filteredByScore.filter((s) => { if (!assignment?.due_date) return false; const sub = new Date(s.submitted_at); const due = new Date(assignment.due_date); return !Number.isNaN(sub.getTime()) && !Number.isNaN(due.getTime()) && sub <= due; })
    : filteredByScore;
  const searchedSubmissions = loweredSearch
    ? filteredByTime.filter((s) => `${s.student_name ?? ''} ${s.student_id ?? ''}`.toLowerCase().includes(loweredSearch))
    : filteredByTime;

  const activeSubmission = useMemo(
    () => filteredSubmissions.find((s) => s.id === reviewSubmissionId) ?? null,
    [filteredSubmissions, reviewSubmissionId]
  );

  const statCards = [
    { label: 'Total', value: filteredSubmissions.length, icon: '📋', color: 'text-[var(--brand-blue-deep)]', bg: 'from-blue-50 to-white border-blue-100' },
    { label: 'Graded', value: gradedSubmissions.length, icon: '✅', color: 'text-emerald-700', bg: 'from-emerald-50 to-white border-emerald-100' },
    { label: 'Ungraded', value: filteredSubmissions.length - gradedSubmissions.length, icon: '⏳', color: 'text-amber-700', bg: 'from-amber-50 to-white border-amber-100' },
    { label: 'Total Points', value: assignment?.total_points ?? '—', icon: '🏆', color: 'text-violet-700', bg: 'from-violet-50 to-white border-violet-100' },
  ];

  if (!assignment) return <div className="py-8 text-center text-sm text-neutral-400">Assignment not found.</div>;

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--brand-blue)' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white opacity-5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-white/70" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Assignment</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{assignment.title}</h2>
            <p className="mt-1 text-sm text-white/70">{assignment.subject_name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-white/60" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">Due</div>
              <div className="text-sm font-semibold text-white">
                {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${card.bg} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <div className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* submissions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="Search student…" value={submissionSearch} onChange={(e) => setSubmissionSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              {(['all', 'graded', 'ungraded'] as const).map((f) => (
                <button key={f} onClick={() => setSubmissionFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors capitalize ${submissionFilter === f ? 'bg-[var(--brand-blue-deep)] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              {(['all', 'on_time', 'late'] as const).map((f) => (
                <button key={f} onClick={() => setTimelinessFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${timelinessFilter === f ? 'bg-[var(--brand-blue-deep)] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                  {f === 'on_time' ? 'On time' : f === 'late' ? 'Late' : 'All'}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-neutral-400">{searchedSubmissions.length} result{searchedSubmissions.length !== 1 ? 's' : ''}</span>
          </div>

          {searchedSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
              {loweredSearch ? 'No matches.' : 'No submissions yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {searchedSubmissions.map((submission) => {
                const status = getStatus(submission.submitted_at);
                return (
                  <Card key={submission.id} className="overflow-hidden border border-neutral-200/80 shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${assignmentAvatarColor(submission.student_name ?? 'S')}`}>
                            {assignmentInitials(submission.student_name ?? 'Student')}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-neutral-900">{submission.student_name ?? 'Student'}</div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                              <span className="text-[11px] text-neutral-400">
                                {new Date(submission.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-neutral-400">Score</div>
                            <div className={`text-lg font-bold ${submission.score != null ? 'text-[var(--brand-blue-deep)]' : 'text-neutral-400'}`}>
                              {submission.score ?? '—'}
                              {submission.score != null && <span className="text-xs font-normal text-neutral-400">/{assignment.total_points}</span>}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => setReviewSubmissionId(submission.id)}>Review</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          <Card className="border border-neutral-200/80 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-neutral-700">Top Scores</span>
              </div>
              {topRankings.length === 0 ? (
                <p className="text-xs text-neutral-400">No graded submissions yet.</p>
              ) : topRankings.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-400' : 'text-neutral-300'}`}>#{i + 1}</span>
                    <span className="text-sm font-medium text-neutral-800">{s.student_name ?? 'Student'}</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--brand-blue-deep)]">{s.score}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border border-neutral-200/80 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--brand-blue-deep)]" />
                <span className="text-sm font-semibold text-neutral-700">Overview</span>
              </div>
              {[
                { label: 'Subject', value: assignment.subject_name },
                { label: 'Due date', value: new Date(assignment.due_date).toLocaleString() },
                { label: 'Total points', value: String(assignment.total_points) },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-neutral-400">{item.label}</span>
                  <span className="font-medium text-neutral-800 text-right">{item.value}</span>
                </div>
              ))}
              {assignment.description && (
                <p className="text-xs text-neutral-500 border-t border-neutral-100 pt-3">{assignment.description}</p>
              )}
            </CardContent>
          </Card>
          <Button variant="secondary" onClick={onBack} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to assignments
          </Button>
        </div>
      </div>

      {/* review dialog */}
      <Dialog open={Boolean(activeSubmission)} onOpenChange={(open) => (!open ? setReviewSubmissionId(null) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Review submission</DialogTitle></DialogHeader>
          {activeSubmission ? (() => {
            const status = getStatus(activeSubmission.submitted_at);
            const draft = drafts[activeSubmission.id];
            const currentScore = draft?.score ?? (activeSubmission.score !== undefined && activeSubmission.score !== null ? String(activeSubmission.score) : '');
            const currentFeedback = draft?.feedback ?? (activeSubmission.feedback ?? '');
            return (
              <div className="space-y-4 text-sm text-neutral-600">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${assignmentAvatarColor(activeSubmission.student_name ?? 'S')}`}>
                      {assignmentInitials(activeSubmission.student_name ?? 'Student')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{activeSubmission.student_name ?? 'Student'}</div>
                      <div className="text-xs text-neutral-400">{new Date(activeSubmission.submitted_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                </div>
                {activeSubmission.submission_text && (
                  <div className="rounded-xl border border-neutral-100 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Response</div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{activeSubmission.submission_text}</p>
                  </div>
                )}
                {activeSubmission.submission_url && (
                  <a href={activeSubmission.submission_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--brand-blue-deep)] hover:underline">Open submitted link ↗</a>
                )}
                {activeSubmission.submission_file && (
                  <a href={activeSubmission.submission_file} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--brand-blue-deep)] hover:underline">View attachment ↗</a>
                )}
                <div className="grid gap-3 md:grid-cols-[140px,1fr]">
                  <Input placeholder="Score" value={currentScore} onChange={(e) => setDraft(activeSubmission.id, { score: e.target.value })} />
                  <Input placeholder="Feedback" value={currentFeedback} onChange={(e) => setDraft(activeSubmission.id, { feedback: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" variant="outline" disabled={aiGradeSubmission.isPending} onClick={() => aiGradeSubmission.mutate(activeSubmission.id)}>
                    {aiGradeSubmission.isPending ? 'AI grading…' : '✨ AI grade'}
                  </Button>
                  <Button type="button" disabled={gradeSubmission.isPending} onClick={() => {
                    const parsedScore = currentScore.trim() === '' ? undefined : Number(currentScore);
                    if (parsedScore !== undefined && Number.isNaN(parsedScore)) return;
                    gradeSubmission.mutate({ submissionId: activeSubmission.id, score: parsedScore, feedback: currentFeedback || undefined });
                  }}>
                    {gradeSubmission.isPending ? 'Saving…' : 'Save grade'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => {
                    gradeSubmission.mutate({ submissionId: activeSubmission.id, score: null, feedback: '' });
                    setDraft(activeSubmission.id, { score: '', feedback: '' });
                  }}>Clear grade</Button>
                </div>
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonInlineView({ lessonId, apiBase, onBack }: { lessonId: string; apiBase: string; onBack: () => void }) {
  const { data: lesson } = useLesson(lessonId);
  const { showToast } = useToast();

  const handleOpen = async () => {
    if (!lesson) return;
    if (lesson.content_type === 'text' && !lesson.file_url) {
      showToast({ title: 'No PDF attached', description: 'This material is text-only.', variant: 'info' });
      return;
    }
    if (lesson.content_type === 'pdf') {
      window.open(`/dashboard/teacher/lessons/${lessonId}/pdf`, '_blank');
      return;
    }
    if (lesson.file_url) {
      window.open(lesson.file_url, '_blank', 'noopener,noreferrer');
      return;
    }
    showToast({ title: 'No file attached', description: 'This material has no file to open.', variant: 'info' });
  };

  const typeIcon: Record<string, string> = { pdf: '📄', video: '🎬', text: '📝', link: '🔗', image: '🖼️' };

  if (!lesson) return <div className="py-8 text-center text-sm text-neutral-400">Loading material…</div>;

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--brand-blue)' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-10" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white opacity-5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{typeIcon[lesson.content_type] ?? '📄'}</span>
              <Badge className="border-white/30 bg-white/15 text-white text-[10px] uppercase tracking-widest">
                {lesson.content_type}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
            <p className="mt-1 text-sm text-white/70">{lesson.subject_name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-white/60" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">Added</div>
              <div className="text-sm font-semibold text-white">
                {new Date(lesson.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <Card className="border border-neutral-200/80 shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--brand-blue-deep)]" />
              <span className="text-sm font-semibold text-neutral-700">Description</span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {lesson.description || 'No description provided for this material.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100">
              <Button onClick={handleOpen} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View PDF
              </Button>
              <Button variant="secondary" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to materials
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-neutral-200/80 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Details</div>
              {[
                { icon: <FileText className="h-4 w-4" />, label: 'Type', value: lesson.content_type.toUpperCase() },
                { icon: <BookOpen className="h-4 w-4" />, label: 'Subject', value: lesson.subject_name },
                { icon: <Calendar className="h-4 w-4" />, label: 'Added', value: new Date(lesson.created_at).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-blue-muted)] text-[var(--brand-blue-deep)]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-neutral-400">{item.label}</div>
                    <div className="text-sm font-medium text-neutral-800">{item.value}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StudentsTab({ sectionSubjectId }: { sectionSubjectId: string }) {
  const { data, isLoading } = useStudentPerformance();
  const section = data?.sections.find((s) => s.section_subject_id === sectionSubjectId);
  const students = section?.students ?? [];

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-neutral-400">Loading students…</div>;
  }
  if (students.length === 0) {
    return <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">No students enrolled yet.</div>;
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/teacher/classes/${sectionSubjectId}/students`}
          className="inline-flex items-center rounded-lg border border-[rgba(15,23,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
        >
          View All Records
        </Link>
      </div>
      <div className="space-y-2">
        {students.map((student, i) => (
          <div key={student.student_id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
              {studentInitials(student.student_name)}
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">{student.student_name}</div>
              {student.student_number && (
                <div className="text-xs text-neutral-400">ID · {student.student_number}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizAttemptsPanel({ quizId }: { quizId: string }) {
  const { data: attempts = [] } = useQuizAttempts(quizId);
  const [activeLogStudentId, setActiveLogStudentId] = useState<string | null>(null);
  const [proctorLogs, setProctorLogs] = useState<QuizProctorLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [violationsByAttempt, setViolationsByAttempt] = useState<Record<string, number>>({});
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const violationsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    violationsRef.current = violationsByAttempt;
  }, [violationsByAttempt]);

  const formatDuration = (startedAt?: string, submittedAt?: string) => {
    if (!startedAt || !submittedAt) return '—';
    const start = new Date(startedAt).getTime();
    const end = new Date(submittedAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
    const totalSeconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };


  useEffect(() => {
    let active = true;
    const loadViolations = async () => {
      const missing = attempts.filter((attempt) => violationsRef.current[attempt.id] === undefined);
      if (missing.length === 0) return;
      setIsLoadingViolations(true);
      try {
        const results = await Promise.all(
          missing.map(async (attempt) => {
            try {
              const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
              const count = logs.reduce(
                (sum, log) => sum + (log.events?.filter((event) => event.type === 'violation').length ?? 0),
                0
              );
              return { id: attempt.id, count };
            } catch {
              return { id: attempt.id, count: 0 };
            }
          })
        );
        if (!active) return;
        setViolationsByAttempt((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            next[item.id] = item.count;
          });
          return next;
        });
      } catch {
        // ignore
      } finally {
        if (active) {
          setIsLoadingViolations(false);
        }
      }
    };
    loadViolations();
    return () => {
      active = false;
    };
  }, [attempts, quizId]);

  if (!attempts.length) {
    return <div className="mt-3 text-xs text-neutral-500">No submissions yet.</div>;
  }

  const gradedAttempts = attempts.filter((attempt) => attempt.score !== undefined && attempt.score !== null);
  const avgScore =
    gradedAttempts.length > 0
      ? Math.round((gradedAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) / gradedAttempts.length) * 10) / 10
      : 0;
  const visibleAttempts = attempts;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600">
        <div>Total: {attempts.length}</div>
        <div>Graded: {gradedAttempts.length}</div>
        <div>Avg score: {gradedAttempts.length ? avgScore : '—'}</div>
      </div>
      <div className="rounded-xl border border-neutral-200/70 bg-white/80 px-3 py-2 text-xs text-neutral-600">
        Showing all attempts.
      </div>
      {visibleAttempts.map((attempt) => {
        const hasManualAnswers = Boolean(
          attempt.answers?.some((answer) => answer.question_type === 'essay' || answer.question_type === 'identification')
        );
        const totalPoints =
          attempt.answers?.reduce((sum, answer) => sum + (answer.question_points ?? 0), 0) ?? 0;
        const violationCount = violationsByAttempt[attempt.id];
        const isSubmitted = Boolean(attempt.submitted_at);
        return (
        <div key={attempt.id} className="rounded-3xl border border-neutral-200/70 bg-white/90 p-5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
                className="text-sm font-semibold text-neutral-900 hover:text-[var(--brand-blue-deep)]"
              >
                {attempt.student_name ?? attempt.student_id}
              </Link>
              <div className="mt-1 text-xs text-neutral-500">
                {attempt.submitted_at ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}` : 'In progress'}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                  {isSubmitted ? 'Submitted' : 'In progress'}
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">
                  Duration: {formatDuration(attempt.started_at, attempt.submitted_at)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    typeof violationCount === 'number' && violationCount > 0
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  Violations:{' '}
                  {typeof violationCount === 'number'
                    ? violationCount
                    : isLoadingViolations
                    ? '…'
                    : '0'}
                </span>
                {hasManualAnswers && (attempt.score === undefined || attempt.score === null) ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                    Manual grading needed
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-semibold text-neutral-700">Score</div>
              <div className="text-2xl font-semibold text-neutral-900">
                {attempt.score ?? 0} / {totalPoints}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              as={Link}
              href={`/dashboard/teacher/quizzes/attempts/${attempt.id}`}
              disabled={!attempt.answers || attempt.answers.length === 0}
            >
              Review answers
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (activeLogStudentId === attempt.student_id) {
                  setActiveLogStudentId(null);
                  setProctorLogs([]);
                  return;
                }
                setIsLoadingLogs(true);
                setActiveLogStudentId(attempt.student_id);
                try {
                  const logs = await quizService.getProctorLogs({ quiz_id: quizId, attempt_id: attempt.id });
                  setProctorLogs(logs);
                  const count = logs.reduce(
                    (sum, log) => sum + (log.events?.filter((event) => event.type === 'violation').length ?? 0),
                    0
                  );
                  setViolationsByAttempt((prev) => ({ ...prev, [attempt.id]: count }));
                } finally {
                  setIsLoadingLogs(false);
                }
              }}
            >
              {activeLogStudentId === attempt.student_id ? 'Hide proctor logs' : 'View proctor logs'}
            </Button>
          </div>
          {activeLogStudentId === attempt.student_id ? (
            <div className="mt-4 rounded-xl border border-neutral-200 bg-[var(--surface-2)] p-3 text-xs text-neutral-600">
              {isLoadingLogs ? (
                <div>Loading logs…</div>
              ) : proctorLogs.length === 0 ? (
                <div>No proctor logs found.</div>
              ) : (
                proctorLogs.map((log) => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        {log.status}
                      </span>
                      <span>Warnings: {log.warnings}</span>
                      <span>Terminations: {log.terminations}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {log.events.slice(0, 4).map((event) => (
                        <div key={event.id} className="rounded-md border border-neutral-200 bg-white p-2">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{event.type}</div>
                          <div>{event.detail ?? '—'}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(event.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    {log.snapshots.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.snapshots.slice(0, 4).map((shot) => (
                          <a key={shot.id} href={shot.image_url} target="_blank" className="text-blue-600 hover:underline">
                            Snapshot ({shot.reason ?? 'captured'})
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-500">No snapshots captured.</div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      );
      })}
      {visibleAttempts.length === 0 ? (
        <div className="text-xs text-neutral-500">No submissions match this filter.</div>
      ) : null}
    </div>
  );
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const sectionSubjectId = params.sectionSubjectId as string;
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const { data: lessons = [] } = useLessons();
  const { data: assignments = [] } = useAssignments();
  const { data: quizzes = [] } = useQuizzes();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const { data: submissions = [] } = useAssignmentSubmissions();
  const gradeSubmission = useGradeSubmission();
  const aiGradeSubmission = useAiGradeSubmission();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const apiBase = env.API_BASE_URL;

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'lessons';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState('');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState('');
  const [expandedQuizId, setExpandedQuizId] = useState('');
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [gradeState, setGradeState] = useState<Record<string, string>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionTimeliness, setSubmissionTimeliness] = useState<'all' | 'late' | 'on_time'>('all');
  const [attendanceTitle, setAttendanceTitle] = useState('');
  const [attendanceDateTime, setAttendanceDateTime] = useState('');
  const [attendanceOnline, setAttendanceOnline] = useState(false);
  const [activeAttendanceSessionId, setActiveAttendanceSessionId] = useState('');
  const [creatingTab, setCreatingTab] = useState<TabKey | null>(null);
  const [viewingLessonId, setViewingLessonId] = useState('');
  const [viewingAssignmentId, setViewingAssignmentId] = useState('');
  const [viewingQuizId, setViewingQuizId] = useState('');

  // Inline create form state
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonType, setNewLessonType] = useState<'text' | 'pdf' | 'link' | 'video'>('text');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonFile, setNewLessonFile] = useState<File | null>(null);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newAssignmentDue, setNewAssignmentDue] = useState('');
  const [newAssignmentPoints, setNewAssignmentPoints] = useState('100');
  const [newAssignmentLate, setNewAssignmentLate] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');
  const [newQuizDue, setNewQuizDue] = useState('');
  const [newQuizTime, setNewQuizTime] = useState('');
  const [newQuizAttempts, setNewQuizAttempts] = useState('1');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDateTime, setNewSessionDateTime] = useState('');
  const [newSessionOnline, setNewSessionOnline] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionDateTime, setEditSessionDateTime] = useState('');
  const [editSessionOpen, setEditSessionOpen] = useState(false);

  const createLesson = useCreateLesson();
  const createAssignment = useCreateAssignment();
  const createQuiz = useCreateQuiz();

  // AI hooks
  const aiGenerateLesson = useAiGenerateLesson();
  const aiSaveLesson = useAiSaveLesson();
  const aiGenerateAssignment = useAiGenerateAssignment();
  const aiSaveAssignment = useAiSaveAssignment();
  const aiGenerateQuiz = useAiGenerateQuiz();
  const aiSaveQuiz = useAiSaveQuiz();

  // Create mode per tab
  const [lessonCreateMode, setLessonCreateMode] = useState<'manual' | 'ai'>('manual');
  const [assignmentCreateMode, setAssignmentCreateMode] = useState<'manual' | 'ai'>('manual');
  const [quizCreateMode, setQuizCreateMode] = useState<'manual' | 'ai'>('manual');

  // AI lesson state
  const [aiLessonPrompt, setAiLessonPrompt] = useState('');
  const [aiLessonType, setAiLessonType] = useState<'text' | 'pdf'>('text');
  const [aiLessonResourceUrl, setAiLessonResourceUrl] = useState('');
  const [aiLessonDraftTitle, setAiLessonDraftTitle] = useState('');
  const [aiLessonDraftDesc, setAiLessonDraftDesc] = useState('');
  const [aiLessonDraftType, setAiLessonDraftType] = useState<'text' | 'pdf'>('text');
  const [aiLessonDraftUrl, setAiLessonDraftUrl] = useState('');
  const [aiLessonPreviewOpen, setAiLessonPreviewOpen] = useState(false);

  // AI assignment state
  const [aiAssignmentPrompt, setAiAssignmentPrompt] = useState('');
  const [aiAssignmentDue, setAiAssignmentDue] = useState('');
  const [aiAssignmentPoints, setAiAssignmentPoints] = useState('100');
  const [aiAssignmentLate, setAiAssignmentLate] = useState(false);
  const [aiAssignmentDraftTitle, setAiAssignmentDraftTitle] = useState('');
  const [aiAssignmentDraftDesc, setAiAssignmentDraftDesc] = useState('');
  const [aiAssignmentDraftDue, setAiAssignmentDraftDue] = useState('');
  const [aiAssignmentDraftPoints, setAiAssignmentDraftPoints] = useState('100');
  const [aiAssignmentDraftLate, setAiAssignmentDraftLate] = useState(false);
  const [aiAssignmentPreviewOpen, setAiAssignmentPreviewOpen] = useState(false);

  // AI quiz state
  const [aiQuizPrompt, setAiQuizPrompt] = useState('');
  const [aiQuizDue, setAiQuizDue] = useState('');
  const [aiQuizPoints, setAiQuizPoints] = useState('100');
  const [aiQuizTime, setAiQuizTime] = useState('');
  const [aiQuizAttempts, setAiQuizAttempts] = useState('1');
  const [aiQuizAiGrade, setAiQuizAiGrade] = useState(true);
  const [aiQuizIsAvailable, setAiQuizIsAvailable] = useState(false);
  const [aiQuizDraftTitle, setAiQuizDraftTitle] = useState('');
  const [aiQuizDraftDesc, setAiQuizDraftDesc] = useState('');
  const [aiQuizDraftDue, setAiQuizDraftDue] = useState('');
  const [aiQuizDraftPoints, setAiQuizDraftPoints] = useState('100');
  const [aiQuizDraftTime, setAiQuizDraftTime] = useState('');
  const [aiQuizDraftAttempts, setAiQuizDraftAttempts] = useState('1');
  const [aiQuizDraftAiGrade, setAiQuizDraftAiGrade] = useState(true);
  const [aiQuizDraftIsAvailable, setAiQuizDraftIsAvailable] = useState(false);
  const [aiQuizDraftQuestions, setAiQuizDraftQuestions] = useState<Array<Record<string, any>>>([]);
  const [aiQuizPreviewOpen, setAiQuizPreviewOpen] = useState(false);
  const [newQuizAiGrade, setNewQuizAiGrade] = useState(true);
  const [newQuizIsAvailable, setNewQuizIsAvailable] = useState(false);

  const sectionSubject = sectionSubjects.find((item) => item.id === sectionSubjectId);
  const filteredLessons = useMemo(
    () => lessons.filter((lesson) => lesson.section_subject_id === sectionSubjectId),
    [lessons, sectionSubjectId]
  );
  const filteredAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.section_subject_id === sectionSubjectId),
    [assignments, sectionSubjectId]
  );
  const filteredQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.section_subject_id === sectionSubjectId),
    [quizzes, sectionSubjectId]
  );
  const { data: attendanceSessions = [] } = useAttendanceSessions({ section_subject: sectionSubjectId });
  const { data: attendanceRecords = [] } = useAttendanceRecords(activeAttendanceSessionId);
  const createAttendanceSession = useCreateAttendanceSession();
  const updateAttendanceSession = useUpdateAttendanceSession();
  const deleteAttendanceSession = useDeleteAttendanceSession();
  const markAttendance = useMarkAttendance(activeAttendanceSessionId);
  const endAttendanceSession = useEndAttendanceSession();
  const startAttendanceSession = useStartAttendanceSession();
  const activeSession = useMemo(
    () => attendanceSessions.find((session) => session.id === activeAttendanceSessionId),
    [attendanceSessions, activeAttendanceSessionId]
  );

  const lessonsCount = filteredLessons.length;
  const assignmentsCount = filteredAssignments.length;
  const quizzesCount = filteredQuizzes.length;
  const attendanceCount = attendanceSessions.length;

  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => filteredAssignments.some((assignment) => assignment.id === submission.assignment_id)),
    [submissions, filteredAssignments]
  );

  const attendanceCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    attendanceRecords.forEach((rec) => {
      counts[rec.status] += 1;
    });
    return counts;
  }, [attendanceRecords]);

  const startEditLesson = (id: string, title: string, description?: string) => {
    setEditingLessonId(id);
    setFormState({
      title,
      description: description ?? '',
    });
  };

  const startEditAssignment = (id: string, title: string, description: string | undefined, dueDate: string, totalPoints: number, allowLate: boolean) => {
    setEditingAssignmentId(id);
    setFormState({
      title,
      description: description ?? '',
      due_date: dueDate.slice(0, 10),
      total_points: String(totalPoints),
      allow_late_submission: allowLate ? 'yes' : 'no',
    });
  };

  const startEditQuiz = (
    id: string,
    title: string,
    description: string | undefined,
    dueDate: string | undefined,
    totalPoints: number,
    timeLimit: number | undefined,
    attemptLimit: number,
    aiGradeOnSubmit?: boolean
  ) => {
    setEditingQuizId(id);
    setFormState({
      title,
      description: description ?? '',
      due_date: dueDate ? dueDate.slice(0, 10) : '',
      total_points: String(totalPoints),
      time_limit_minutes: timeLimit ? String(timeLimit) : '',
      attempt_limit: String(attemptLimit),
      ai_grade_on_submit: aiGradeOnSubmit ? 'yes' : 'no',
    });
  };

  const resetEditing = () => {
    setEditingLessonId('');
    setEditingAssignmentId('');
    setEditingQuizId('');
    setFormState({});
  };

  const handleOpenLessonFile = async (lessonId: string) => {
    try {
      const downloadUrl = `${apiBase}/api/learning-materials/${lessonId}/download/`;
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast({ title: 'PDF unavailable', description: 'Unable to load the PDF file.', variant: 'error' });
    }
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Class Details" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={sectionSubject ? `${sectionSubject.subject_name}` : 'Class detail'}
          description={sectionSubject ? `${sectionSubject.section_name}${sectionSubject.term_label ? ` · ${sectionSubject.term_label}` : ''}` : 'Manage learning materials, assignments, and quizzes.'}
        />

        {/* ── Tabs + action buttons ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm flex flex-wrap gap-0.5">
            {([
              { key: 'students', label: 'Students' },
              { key: 'lessons', label: `Learning Materials (${lessonsCount})` },
              { key: 'assignments', label: `Assignments (${assignmentsCount})` },
              { key: 'quizzes', label: `Quizzes (${quizzesCount})` },
              { key: 'attendance', label: `Class Sessions (${attendanceCount})` },
            ] as { key: TabKey; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveTab(key); setViewingLessonId(''); setViewingAssignmentId(''); setViewingQuizId(''); setCreatingTab(null); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === key
                    ? 'bg-[var(--brand-blue-deep)] text-white shadow'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {activeTab === 'lessons' && !viewingLessonId && (
              <button onClick={() => setCreatingTab(creatingTab === 'lessons' ? null : 'lessons')}
                className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                {creatingTab === 'lessons' ? '✕ Cancel' : '+ New Learning Material'}
              </button>
            )}
            {activeTab === 'assignments' && !viewingAssignmentId && (
              <button onClick={() => setCreatingTab(creatingTab === 'assignments' ? null : 'assignments')}
                className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                {creatingTab === 'assignments' ? '✕ Cancel' : '+ New Assignment'}
              </button>
            )}
            {activeTab === 'quizzes' && !viewingQuizId && (
              <button onClick={() => setCreatingTab(creatingTab === 'quizzes' ? null : 'quizzes')}
                className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                {creatingTab === 'quizzes' ? '✕ Cancel' : '+ New Quiz'}
              </button>
            )}
            {activeTab === 'attendance' && (
              <button onClick={() => setCreatingTab(creatingTab === 'attendance' ? null : 'attendance')}
                className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                {creatingTab === 'attendance' ? '✕ Cancel' : '+ New Session'}
              </button>
            )}
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="space-y-3 pt-6">

            {/* Students tab */}
            {activeTab === 'students' && (
              <StudentsTab sectionSubjectId={sectionSubjectId} />
            )}

            {/* Learning Materials tab */}
            {activeTab === 'lessons' && (
              viewingLessonId ? (
                <LessonInlineView
                  lessonId={viewingLessonId}
                  apiBase={apiBase}
                  onBack={() => setViewingLessonId('')}
                />
              ) : creatingTab === 'lessons' ? (
                <div className="space-y-4">
                  {/* Mode toggle */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
                      <button type="button" onClick={() => setLessonCreateMode('manual')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${lessonCreateMode === 'manual' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        Manual
                      </button>
                      <button type="button" onClick={() => setLessonCreateMode('ai')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${lessonCreateMode === 'ai' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        AI Draft
                      </button>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {lessonCreateMode === 'ai' ? 'Generate a draft with AI' : 'Create a learning material yourself'}
                    </span>
                  </div>

                  {lessonCreateMode === 'ai' ? (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>AI learning material request</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Material type</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiLessonType} onChange={(e) => setAiLessonType(e.target.value as 'text' | 'pdf')}>
                            <option value="text">Text</option>
                            <option value="pdf">PDF (text draft)</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            placeholder="Example: Create a learning material about cellular respiration for Grade 10 with a short activity."
                            value={aiLessonPrompt} onChange={(e) => setAiLessonPrompt(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Resource URL (optional)</label>
                          <Input placeholder="Paste a link if you want the material to reference a specific resource."
                            value={aiLessonResourceUrl} onChange={(e) => setAiLessonResourceUrl(e.target.value)} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                          <Button onClick={async () => {
                            if (!sectionSubjectId || !aiLessonPrompt.trim()) return;
                            const draft = await aiGenerateLesson.mutateAsync({ section_subject: sectionSubjectId, prompt: aiLessonPrompt.trim(), type: aiLessonType, file_url: aiLessonResourceUrl.trim() || undefined });
                            if (draft) { setAiLessonDraftTitle(draft.title); setAiLessonDraftDesc(draft.description); setAiLessonDraftType(draft.type); setAiLessonDraftUrl(draft.file_url ?? ''); setAiLessonPreviewOpen(true); }
                            setAiLessonPrompt(''); setAiLessonResourceUrl('');
                          }} disabled={aiGenerateLesson.isPending || !aiLessonPrompt.trim()}>
                            {aiGenerateLesson.isPending ? 'Generating…' : 'Generate material'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>Manual learning material</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Material type</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={newLessonType} onChange={(e) => setNewLessonType(e.target.value as any)}>
                            <option value="text">Text</option>
                            <option value="pdf">PDF (upload)</option>
                            <option value="link">External link</option>
                            <option value="video">Video link</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input placeholder="Material title" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={newLessonDesc} onChange={(e) => setNewLessonDesc(e.target.value)} />
                        </div>
                        {newLessonType !== 'text' && newLessonType !== 'pdf' && (
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Resource URL</label>
                            <Input placeholder="Paste a link" value={newLessonUrl} onChange={(e) => setNewLessonUrl(e.target.value)} />
                          </div>
                        )}
                        {newLessonType === 'pdf' && (
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">PDF File</label>
                            <input type="file" accept=".pdf" onChange={(e) => setNewLessonFile(e.target.files?.[0] ?? null)}
                              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-700" />
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <Button disabled={createLesson.isPending || !newLessonTitle.trim()} onClick={async () => {
                            if (!sectionSubjectId || !newLessonTitle.trim()) return;
                            if (newLessonType === 'pdf' && newLessonFile) {
                              const form = new FormData();
                              form.append('section_subject', sectionSubjectId);
                              form.append('title', newLessonTitle.trim());
                              form.append('description', newLessonDesc.trim());
                              form.append('type', newLessonType);
                              form.append('file', newLessonFile);
                              await createLesson.mutateAsync(form);
                            } else {
                              await createLesson.mutateAsync({ section_subject: sectionSubjectId, title: newLessonTitle.trim(), description: newLessonDesc.trim(), type: newLessonType, file_url: newLessonUrl.trim() || undefined });
                            }
                            setNewLessonTitle(''); setNewLessonDesc(''); setNewLessonUrl(''); setNewLessonFile(null);
                            setCreatingTab(null);
                          }}>
                            {createLesson.isPending ? 'Saving…' : 'Save material'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Preview Dialog */}
                  <Dialog open={aiLessonPreviewOpen} onOpenChange={setAiLessonPreviewOpen} >
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>AI learning material preview</DialogTitle></DialogHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input value={aiLessonDraftTitle} onChange={(e) => setAiLessonDraftTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={8} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={aiLessonDraftDesc} onChange={(e) => setAiLessonDraftDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiLessonDraftType} onChange={(e) => setAiLessonDraftType(e.target.value as 'text' | 'pdf')}>
                            <option value="text">Text</option>
                            <option value="pdf">PDF</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Resource URL (optional)</label>
                          <Input value={aiLessonDraftUrl} onChange={(e) => setAiLessonDraftUrl(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        {aiLessonDraftType === 'pdf' && (
                          <Button variant="outline" onClick={async () => {
                            const blob = await lessonService.aiPreviewPdf({ section_subject: sectionSubjectId, title: aiLessonDraftTitle.trim(), description: aiLessonDraftDesc.trim(), file_url: aiLessonDraftUrl.trim() || undefined });
                            const url = URL.createObjectURL(blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 10000);
                          }}>Preview PDF</Button>
                        )}
                        <Button disabled={aiSaveLesson.isPending || !aiLessonDraftTitle.trim()} onClick={async () => {
                          await aiSaveLesson.mutateAsync({ section_subject: sectionSubjectId, title: aiLessonDraftTitle.trim(), description: aiLessonDraftDesc.trim(), type: aiLessonDraftType, file_url: aiLessonDraftUrl.trim() || undefined });
                          setAiLessonPreviewOpen(false); setAiLessonDraftTitle(''); setAiLessonDraftDesc(''); setAiLessonDraftType('text'); setAiLessonDraftUrl('');
                          setCreatingTab(null);
                        }}>
                          {aiSaveLesson.isPending ? 'Saving…' : 'Save material'}
                        </Button>
                        <Button variant="outline" onClick={() => { setAiLessonPreviewOpen(false); setAiLessonDraftTitle(''); setAiLessonDraftDesc(''); }}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <>
                  {filteredLessons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">No learning materials yet.</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...filteredLessons].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((lesson) => {
                    const typeColor: Record<string, { color: string; light: string }> = {
                      pdf:   { color: '#dc2626', light: 'rgba(220,38,38,0.08)' },
                      video: { color: '#7c3aed', light: 'rgba(124,58,237,0.08)' },
                      link:  { color: '#0891b2', light: 'rgba(8,145,178,0.08)' },
                      text:  { color: '#059669', light: 'rgba(5,150,105,0.08)' },
                    };
                    const tc = typeColor[lesson.content_type] ?? { color: '#6b7280', light: 'rgba(107,114,128,0.08)' };
                    const typeIcon: Record<string, string> = { pdf: '📄', video: '🎬', text: '📝', link: '🔗' };
                    return (
                      <div key={lesson.id} className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="h-1.5 w-full" style={{ background: tc.color }} />
                        <div className="flex flex-1 flex-col p-5">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcon[lesson.content_type] ?? '📄'}</span>
                              <div>
                                <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{lesson.title}</div>
                                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Added {new Date(lesson.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: tc.light, color: tc.color }}>
                              {lesson.content_type.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-auto pt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setViewingLessonId(lesson.id)}
                              className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                              View material
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  )}
                </>
              )
            )}

            {/* Assignments tab */}
            {activeTab === 'assignments' && (
              viewingAssignmentId ? (
                <AssignmentInlineView
                  assignmentId={viewingAssignmentId}
                  assignments={filteredAssignments}
                  submissions={filteredSubmissions}
                  gradeSubmission={gradeSubmission}
                  aiGradeSubmission={aiGradeSubmission}
                  onBack={() => setViewingAssignmentId('')}
                />
              ) : creatingTab === 'assignments' ? (
                <div className="space-y-4">
                  {/* Mode toggle */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
                      <button type="button" onClick={() => setAssignmentCreateMode('manual')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${assignmentCreateMode === 'manual' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        Manual
                      </button>
                      <button type="button" onClick={() => setAssignmentCreateMode('ai')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${assignmentCreateMode === 'ai' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        AI Draft
                      </button>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {assignmentCreateMode === 'ai' ? 'Generate an assignment with AI' : 'Create an assignment yourself'}
                    </span>
                  </div>

                  {assignmentCreateMode === 'ai' ? (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>AI assignment request</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={aiAssignmentDue} onChange={(e) => setAiAssignmentDue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                          <Input type="number" min="0" value={aiAssignmentPoints} onChange={(e) => setAiAssignmentPoints(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <input type="checkbox" checked={aiAssignmentLate} onChange={(e) => setAiAssignmentLate(e.target.checked)} />
                          Allow late submissions
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            placeholder="Example: Create a Grade 10 physics assignment on Newton's laws with 5 problems."
                            value={aiAssignmentPrompt} onChange={(e) => setAiAssignmentPrompt(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <Button onClick={async () => {
                            if (!sectionSubjectId || !aiAssignmentPrompt.trim()) return;
                            const dueDate = aiAssignmentDue ? toIso(aiAssignmentDue) : undefined;
                            const draft = await aiGenerateAssignment.mutateAsync({ section_subject: sectionSubjectId, prompt: aiAssignmentPrompt.trim(), due_date: dueDate, total_points: Number(aiAssignmentPoints) || 100, allow_late_submission: aiAssignmentLate });
                            if (draft) { setAiAssignmentDraftTitle(draft.title); setAiAssignmentDraftDesc(draft.description); setAiAssignmentDraftDue(draft.due_date ?? ''); setAiAssignmentDraftPoints(String(draft.total_points ?? 100)); setAiAssignmentDraftLate(Boolean(draft.allow_late_submission)); setAiAssignmentPreviewOpen(true); }
                            setAiAssignmentPrompt('');
                          }} disabled={aiGenerateAssignment.isPending || !aiAssignmentPrompt.trim()}>
                            {aiGenerateAssignment.isPending ? 'Generating…' : 'Generate assignment'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>Manual assignment</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={newAssignmentDue} onChange={(e) => setNewAssignmentDue(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input value={newAssignmentTitle} onChange={(e) => setNewAssignmentTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={newAssignmentDesc} onChange={(e) => setNewAssignmentDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                          <Input type="number" min="0" value={newAssignmentPoints} onChange={(e) => setNewAssignmentPoints(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <input type="checkbox" checked={newAssignmentLate} onChange={(e) => setNewAssignmentLate(e.target.checked)} />
                          Allow late submissions
                        </div>
                        <div className="md:col-span-2">
                          <Button disabled={createAssignment.isPending || !newAssignmentTitle.trim() || !newAssignmentDue} onClick={async () => {
                            if (!sectionSubjectId || !newAssignmentTitle.trim() || !newAssignmentDue) return;
                            await createAssignment.mutateAsync({ section_subject: sectionSubjectId, title: newAssignmentTitle.trim(), description: newAssignmentDesc.trim(), due_date: toIso(newAssignmentDue), total_points: Number(newAssignmentPoints), allow_late_submission: newAssignmentLate });
                            setNewAssignmentTitle(''); setNewAssignmentDesc(''); setNewAssignmentDue(''); setNewAssignmentPoints('100'); setNewAssignmentLate(false);
                            setCreatingTab(null);
                          }}>
                            {createAssignment.isPending ? 'Saving…' : 'Save assignment'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Preview Dialog */}
                  <Dialog open={aiAssignmentPreviewOpen} onOpenChange={setAiAssignmentPreviewOpen}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>AI assignment preview</DialogTitle></DialogHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input value={aiAssignmentDraftTitle} onChange={(e) => setAiAssignmentDraftTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={6} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={aiAssignmentDraftDesc} onChange={(e) => setAiAssignmentDraftDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={aiAssignmentDraftDue} onChange={(e) => setAiAssignmentDraftDue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Total points</label>
                          <Input type="number" min="0" value={aiAssignmentDraftPoints} onChange={(e) => setAiAssignmentDraftPoints(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 md:col-span-2">
                          <input type="checkbox" checked={aiAssignmentDraftLate} onChange={(e) => setAiAssignmentDraftLate(e.target.checked)} />
                          Allow late submissions
                        </div>
                      </div>
                      <DialogFooter>
                        <Button disabled={aiSaveAssignment.isPending || !aiAssignmentDraftTitle.trim()} onClick={async () => {
                          const dueDate = aiAssignmentDraftDue ? toIso(aiAssignmentDraftDue) : undefined;
                          await aiSaveAssignment.mutateAsync({ section_subject: sectionSubjectId, title: aiAssignmentDraftTitle.trim(), description: aiAssignmentDraftDesc.trim(), total_points: Number(aiAssignmentDraftPoints) || 100, due_date: dueDate, allow_late_submission: aiAssignmentDraftLate });
                          setAiAssignmentPreviewOpen(false); setAiAssignmentDraftTitle(''); setAiAssignmentDraftDesc(''); setAiAssignmentDraftDue(''); setAiAssignmentDraftPoints('100'); setAiAssignmentDraftLate(false);
                          setCreatingTab(null);
                        }}>
                          {aiSaveAssignment.isPending ? 'Saving…' : 'Save assignment'}
                        </Button>
                        <Button variant="outline" onClick={() => { setAiAssignmentPreviewOpen(false); setAiAssignmentDraftTitle(''); setAiAssignmentDraftDesc(''); }}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <>
                  {filteredAssignments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">No assignments yet.</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...filteredAssignments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((assignment) => {
                        const isPast = new Date(assignment.due_date).getTime() < Date.now();
                        const dueBadgeColor = isPast ? { color: '#dc2626', light: 'rgba(220,38,38,0.08)' } : { color: '#0891b2', light: 'rgba(8,145,178,0.08)' };
                        return (
                          <div key={assignment.id} className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="h-1.5 w-full" style={{ background: dueBadgeColor.color }} />
                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{assignment.title}</div>
                                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{assignment.total_points} pts</div>
                                </div>
                                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: dueBadgeColor.light, color: dueBadgeColor.color }}>
                                  Due {new Date(assignment.due_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                {assignment.allow_late_submission && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">Late allowed</span>}
                              </div>
                              <div className="mt-auto pt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => setViewingAssignmentId(assignment.id)}
                                  className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                                  View submissions
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            )}

            {/* Quizzes tab */}
            {activeTab === 'quizzes' && (
              viewingQuizId ? (
                <QuizInlineView
                  quizId={viewingQuizId}
                  quizzes={filteredQuizzes}
                  onBack={() => setViewingQuizId('')}
                />
              ) : creatingTab === 'quizzes' ? (
                <div className="space-y-4">
                  {/* Mode toggle */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-full border border-[rgba(15,23,42,0.12)] bg-white/80 p-1 shadow-sm">
                      <button type="button" onClick={() => setQuizCreateMode('manual')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${quizCreateMode === 'manual' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        Manual
                      </button>
                      <button type="button" onClick={() => setQuizCreateMode('ai')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${quizCreateMode === 'ai' ? 'bg-[var(--brand-blue-deep)] text-white shadow' : 'text-neutral-600 hover:text-neutral-900'}`}>
                        AI Draft
                      </button>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {quizCreateMode === 'ai' ? 'Generate a quiz with AI' : 'Create a quiz yourself'}
                    </span>
                  </div>

                  {quizCreateMode === 'ai' ? (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>AI quiz request</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={aiQuizDue} onChange={(e) => setAiQuizDue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                          <Input type="number" min="0" value={aiQuizTime} onChange={(e) => setAiQuizTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                          <Input type="number" min="1" value={aiQuizAttempts} onChange={(e) => setAiQuizAttempts(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiQuizAiGrade ? 'yes' : 'no'} onChange={(e) => setAiQuizAiGrade(e.target.value === 'yes')}>
                            <option value="yes">Enabled</option>
                            <option value="no">Disabled</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                          <input disabled value="Strict" className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-gray-50 px-3 text-sm text-neutral-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiQuizIsAvailable ? 'yes' : 'no'} onChange={(e) => setAiQuizIsAvailable(e.target.value === 'yes')}>
                            <option value="no">Not available yet</option>
                            <option value="yes">Available to students</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            placeholder="Example: Create a 10-question biology quiz on cell division."
                            value={aiQuizPrompt} onChange={(e) => setAiQuizPrompt(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <Button onClick={async () => {
                            if (!sectionSubjectId || !aiQuizPrompt.trim()) return;
                            const draft = await aiGenerateQuiz.mutateAsync({ section_subject: sectionSubjectId, prompt: aiQuizPrompt.trim(), due_date: aiQuizDue ? toIso(aiQuizDue) : undefined, time_limit_minutes: aiQuizTime ? Number(aiQuizTime) : undefined, attempt_limit: aiQuizAttempts ? Number(aiQuizAttempts) : undefined, ai_grade_on_submit: aiQuizAiGrade, security_level: 'strict', is_available: aiQuizIsAvailable });
                            if (draft) { setAiQuizDraftTitle(draft.title); setAiQuizDraftDesc(draft.description); setAiQuizDraftDue(draft.due_date ?? ''); setAiQuizDraftTime(draft.time_limit_minutes ? String(draft.time_limit_minutes) : ''); setAiQuizDraftAttempts(String(draft.attempt_limit ?? 1)); setAiQuizDraftAiGrade(draft.ai_grade_on_submit ?? true); setAiQuizDraftIsAvailable(draft.is_available ?? false); setAiQuizDraftQuestions(draft.questions ?? []); setAiQuizPreviewOpen(true); }
                            setAiQuizPrompt('');
                          }} disabled={aiGenerateQuiz.isPending || !aiQuizPrompt.trim()}>
                            {aiGenerateQuiz.isPending ? 'Generating…' : 'Generate quiz'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                      <CardHeader><CardTitle>Manual quiz</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={newQuizDue} onChange={(e) => setNewQuizDue(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={newQuizDesc} onChange={(e) => setNewQuizDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                          <Input type="number" min="0" value={newQuizTime} onChange={(e) => setNewQuizTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                          <Input type="number" min="1" value={newQuizAttempts} onChange={(e) => setNewQuizAttempts(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={newQuizAiGrade ? 'yes' : 'no'} onChange={(e) => setNewQuizAiGrade(e.target.value === 'yes')}>
                            <option value="yes">Enabled</option>
                            <option value="no">Disabled</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                          <input disabled value="Strict" className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-gray-50 px-3 text-sm text-neutral-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={newQuizIsAvailable ? 'yes' : 'no'} onChange={(e) => setNewQuizIsAvailable(e.target.value === 'yes')}>
                            <option value="no">Not available yet</option>
                            <option value="yes">Available to students</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Button disabled={createQuiz.isPending || !newQuizTitle.trim()} onClick={async () => {
                            if (!sectionSubjectId || !newQuizTitle.trim()) return;
                            await createQuiz.mutateAsync({ section_subject: sectionSubjectId, title: newQuizTitle.trim(), description: newQuizDesc.trim(), due_date: newQuizDue ? toIso(newQuizDue) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), time_limit_minutes: newQuizTime ? Number(newQuizTime) : undefined, attempt_limit: Number(newQuizAttempts) || 1, total_points: 0, security_level: 'strict', ai_grade_on_submit: newQuizAiGrade, is_available: newQuizIsAvailable });
                            setNewQuizTitle(''); setNewQuizDesc(''); setNewQuizDue(''); setNewQuizTime(''); setNewQuizAttempts('1'); setNewQuizAiGrade(true); setNewQuizIsAvailable(false);
                            setCreatingTab(null);
                          }}>
                            {createQuiz.isPending ? 'Saving…' : 'Save quiz'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Preview Dialog */}
                  <Dialog open={aiQuizPreviewOpen} onOpenChange={setAiQuizPreviewOpen}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader><DialogTitle>AI quiz preview</DialogTitle></DialogHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                          <Input value={aiQuizDraftTitle} onChange={(e) => setAiQuizDraftTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                          <textarea rows={4} className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                            value={aiQuizDraftDesc} onChange={(e) => setAiQuizDraftDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Due date</label>
                          <Input type="datetime-local" min={nowLocal()} value={aiQuizDraftDue} onChange={(e) => setAiQuizDraftDue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Time limit (minutes)</label>
                          <Input type="number" min="0" value={aiQuizDraftTime} onChange={(e) => setAiQuizDraftTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attempt limit</label>
                          <Input type="number" min="1" value={aiQuizDraftAttempts} onChange={(e) => setAiQuizDraftAttempts(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">AI grade on submit</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiQuizDraftAiGrade ? 'yes' : 'no'} onChange={(e) => setAiQuizDraftAiGrade(e.target.value === 'yes')}>
                            <option value="yes">Enabled</option>
                            <option value="no">Disabled</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Security level</label>
                          <input disabled value="Strict" className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-gray-50 px-3 text-sm text-neutral-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Availability</label>
                          <select className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                            value={aiQuizDraftIsAvailable ? 'yes' : 'no'} onChange={(e) => setAiQuizDraftIsAvailable(e.target.value === 'yes')}>
                            <option value="no">Not available yet</option>
                            <option value="yes">Available to students</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Questions</label>
                          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700">
                            {aiQuizDraftQuestions.length === 0 ? (
                              <div className="text-xs text-neutral-500">No questions generated yet.</div>
                            ) : aiQuizDraftQuestions.map((q, i) => (
                              <div key={i} className="border-b border-neutral-100 pb-2">
                                <div className="font-semibold">Q{i + 1}: {q.question_text || q.question}</div>
                                <div className="text-xs text-neutral-500">{q.question_type || 'multiple_choice'} • {q.points ?? 1} pts</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button disabled={aiSaveQuiz.isPending || !aiQuizDraftTitle.trim()} onClick={async () => {
                          await aiSaveQuiz.mutateAsync({ section_subject: sectionSubjectId, title: aiQuizDraftTitle.trim(), description: aiQuizDraftDesc.trim(), due_date: aiQuizDraftDue ? toIso(aiQuizDraftDue) : undefined, time_limit_minutes: aiQuizDraftTime ? Number(aiQuizDraftTime) : undefined, attempt_limit: aiQuizDraftAttempts ? Number(aiQuizDraftAttempts) : undefined, questions: aiQuizDraftQuestions, ai_grade_on_submit: aiQuizDraftAiGrade, security_level: 'strict', is_available: aiQuizDraftIsAvailable });
                          setAiQuizPreviewOpen(false); setAiQuizDraftTitle(''); setAiQuizDraftDesc(''); setAiQuizDraftDue(''); setAiQuizDraftTime(''); setAiQuizDraftAttempts('1'); setAiQuizDraftAiGrade(true); setAiQuizDraftIsAvailable(false); setAiQuizDraftQuestions([]);
                          setCreatingTab(null);
                        }}>
                          {aiSaveQuiz.isPending ? 'Saving…' : 'Save quiz'}
                        </Button>
                        <Button variant="outline" onClick={() => { setAiQuizPreviewOpen(false); setAiQuizDraftTitle(''); setAiQuizDraftDesc(''); setAiQuizDraftQuestions([]); }}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <>
                  {filteredQuizzes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-sm text-neutral-500">No quizzes yet.</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...filteredQuizzes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((quiz) => {
                        const isAvailable = quiz.is_available !== false;
                        const stateColor = isAvailable
                          ? { color: '#059669', light: 'rgba(5,150,105,0.08)', label: 'Available' }
                          : { color: '#6b7280', light: 'rgba(107,114,128,0.08)', label: 'Not available' };
                        return (
                          <div key={quiz.id} className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="h-1.5 w-full" style={{ background: stateColor.color }} />
                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{quiz.title}</div>
                                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                    Due {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : '—'}
                                  </div>
                                </div>
                                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: stateColor.light, color: stateColor.color }}>
                                  {stateColor.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">{quiz.attempt_limit} attempt{quiz.attempt_limit !== 1 ? 's' : ''}</span>
                                {quiz.time_limit_minutes && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">{quiz.time_limit_minutes} min</span>}
                                {quiz.ai_grade_on_submit && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5">✨ AI grade</span>}
                              </div>
                              <div className="mt-auto pt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => setViewingQuizId(quiz.id)}
                                  className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]">
                                  View submissions
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            )}

            {/* Class Sessions tab */}
            {activeTab === 'attendance' && (
              creatingTab === 'attendance' ? (
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
                    <Video className="h-4 w-4" style={{ color: 'var(--brand-blue)' }} />
                    <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Create Class Session</h2>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>— Students will be notified automatically.</span>
                  </div>
                  <div className="grid gap-4 p-6 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Title</label>
                      <Input value={newSessionTitle} onChange={(e) => setNewSessionTitle(e.target.value)} placeholder="e.g. Week 3 Class" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Date & Time</label>
                      <Input type="datetime-local" min={nowLocal()} value={newSessionDateTime} onChange={(e) => setNewSessionDateTime(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <input type="checkbox" checked={newSessionOnline} onChange={(e) => setNewSessionOnline(e.target.checked)} className="h-4 w-4" />
                      Online class (Jitsi)
                    </div>
                    <div className="md:col-span-3">
                      <Button disabled={createAttendanceSession.isPending || !newSessionDateTime} onClick={async () => {
                        if (!sectionSubjectId || !newSessionDateTime) return;
                        if (isPastDate(newSessionDateTime)) { showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' }); return; }
                        await createAttendanceSession.mutateAsync({ section_subject: sectionSubjectId, title: newSessionTitle.trim() || undefined, scheduled_at: new Date(newSessionDateTime).toISOString(), is_online_class: newSessionOnline });
                        setNewSessionTitle(''); setNewSessionDateTime(''); setNewSessionOnline(false);
                        setCreatingTab(null);
                      }}>
                        {createAttendanceSession.isPending ? 'Creating…' : 'Create Session'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {attendanceSessions.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 p-12 text-center">
                      <Video className="h-8 w-8 text-neutral-300" />
                      <p className="text-sm text-neutral-500">No class sessions yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {attendanceSessions.map((session) => {
                        const state = session.ended_at ? 'ended' : session.is_live ? 'live' : 'upcoming';
                        const stateStyle = {
                          live:     { color: '#059669', light: 'rgba(5,150,105,0.1)',   label: 'Live'     },
                          upcoming: { color: '#0891b2', light: 'rgba(8,145,178,0.1)',   label: 'Upcoming' },
                          ended:    { color: '#6b7280', light: 'rgba(107,114,128,0.1)', label: 'Ended'    },
                        }[state];
                        return (
                          <div key={session.id} className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="h-1.5 w-full" style={{ background: stateStyle.color }} />
                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{session.title || 'Class Session'}</h3>
                                </div>
                                <span className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                  style={{ background: stateStyle.light, color: stateStyle.color }}>
                                  {state === 'live' && <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: stateStyle.color }} /><span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: stateStyle.color }} /></span>}
                                  {stateStyle.label}
                                </span>
                              </div>
                              <div className="mb-4 flex flex-wrap gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(session.scheduled_at).toLocaleString()}</span>
                                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{(session.present_count ?? 0) + (session.late_count ?? 0)} / {session.total_count ?? 0} joined</span>
                                {session.is_online_class && <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" />Online</span>}
                              </div>
                              <div className="mt-auto flex flex-wrap gap-2">
                                <Button size="sm" disabled={startAttendanceSession.isPending || Boolean(session.ended_at) || session.is_live}
                                  style={state === 'upcoming' ? { background: 'var(--brand-blue)', color: '#fff' } : {}}
                                  onClick={async () => {
                                    try { const r = await startAttendanceSession.mutateAsync(session.id); const url = (r as any)?.join_url ?? session.join_url; if (url) window.open(url, '_blank'); } catch {}
                                  }}>
                                  <Play className="h-3.5 w-3.5 mr-1" />
                                  {session.ended_at ? 'Ended' : session.is_live ? 'Live' : startAttendanceSession.isPending ? 'Starting…' : 'Start'}
                                </Button>
                                {session.join_url && session.is_live && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(session.join_url ?? '', '_blank')}>Open Link</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditSessionId(session.id);
                                  setEditSessionTitle(session.title ?? '');
                                  const d = new Date(session.scheduled_at);
                                  const pad = (v: number) => v.toString().padStart(2, '0');
                                  setEditSessionDateTime(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                                  setEditSessionOpen(true);
                                }}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="outline" disabled={endAttendanceSession.isPending || Boolean(session.ended_at)}
                                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                  onClick={() => endAttendanceSession.mutate(session.id)}>
                                  <Square className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="destructive" disabled={deleteAttendanceSession.isPending}
                                  onClick={async () => {
                                    const ok = await confirm({ title: 'Delete session', description: 'Remove this session? This cannot be undone.', danger: true });
                                    if (ok) deleteAttendanceSession.mutate(session.id);
                                  }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Edit dialog */}
                  <Dialog open={editSessionOpen} onOpenChange={setEditSessionOpen}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Edit Class Session</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Title</label>
                          <Input value={editSessionTitle} onChange={(e) => setEditSessionTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Date & Time</label>
                          <Input type="datetime-local" min={nowLocal()} value={editSessionDateTime} onChange={(e) => setEditSessionDateTime(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="secondary" onClick={() => setEditSessionOpen(false)}>Cancel</Button>
                        <Button disabled={!editSessionId || updateAttendanceSession.isPending} onClick={async () => {
                          if (!editSessionId || !editSessionDateTime) return;
                          if (isPastDate(editSessionDateTime)) { showToast({ title: 'Invalid date', description: 'Schedule must be today or in the future.', variant: 'error' }); return; }
                          await updateAttendanceSession.mutateAsync({ sessionId: editSessionId, payload: { title: editSessionTitle.trim() || undefined, scheduled_at: new Date(editSessionDateTime).toISOString() } });
                          setEditSessionOpen(false);
                        }}>
                          {updateAttendanceSession.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )
            )}

          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
