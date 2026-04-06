'use client';

import { use, useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { teacherNav } from '@/components/navigation/nav-config';
import { useQuiz } from '@/features/quizzes/hooks/useQuiz';
import { quizService } from '@/features/quizzes/services/quizService';
import { useToast } from '@/components/ui/toast';

type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'identification';
type EditableChoice = { id?: string; text: string; is_correct: boolean; removed?: boolean };

export default function TeacherQuizManagePage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const { data: quiz, refetch } = useQuiz(quizId);
  const { showToast } = useToast();
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [points, setPoints] = useState('1');
  const [choices, setChoices] = useState([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPoints, setEditingPoints] = useState('1');
  const [editingType, setEditingType] = useState<QuestionType>('multiple_choice');
  const [ordering, setOrdering] = useState<string[]>([]);
  const [editingChoices, setEditingChoices] = useState<EditableChoice[]>([]);

  const editingQuestion = useMemo(
    () => quiz?.questions?.find((question) => question.id === editingId),
    [quiz?.questions, editingId]
  );

  const addChoice = () => setChoices((prev) => [...prev, { text: '', is_correct: false }]);
  const setCorrectChoice = (index: number) =>
    setChoices((prev) => prev.map((choice, idx) => ({ ...choice, is_correct: idx === index })));
  const addEditingChoice = () => setEditingChoices((prev) => [...prev, { text: '', is_correct: false }]);
  const setCorrectEditingChoice = (index: number) =>
    setEditingChoices((prev) => prev.map((choice, idx) => ({ ...choice, is_correct: idx === index })));

  const updateEditingChoice = (index: number, field: 'text' | 'is_correct', value: string | boolean) => {
    setEditingChoices((prev) =>
      prev.map((choice, idx) => (idx === index ? { ...choice, [field]: value } : choice))
    );
  };

  const removeEditingChoice = (index: number) => {
    setEditingChoices((prev) => {
      const target = prev[index];
      if (!target) return prev;
      if (target.id) {
        return prev.map((choice, idx) => (idx === index ? { ...choice, removed: true } : choice));
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  useEffect(() => {
    if (questionType === 'true_false') {
      setChoices([
        { text: 'True', is_correct: true },
        { text: 'False', is_correct: false },
      ]);
    }
  }, [questionType]);

  useEffect(() => {
    if (editingId && editingType === 'true_false') {
      setEditingChoices([
        { text: 'True', is_correct: true },
        { text: 'False', is_correct: false },
      ]);
    }
  }, [editingId, editingType]);

  const beginEdit = (question: {
    id: string;
    question_text: string;
    points: number;
    question_type: QuestionType;
    choices?: Array<{ id: string; choice_text: string; is_correct: boolean }>;
  }) => {
    setEditingId(question.id);
    setEditingText(question.question_text);
    setEditingPoints(String(question.points));
    setEditingType(question.question_type);
    setEditingChoices(
      (question.choices ?? []).map((choice) => ({
        id: choice.id,
        text: choice.choice_text,
        is_correct: choice.is_correct,
      }))
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
    setEditingPoints('1');
    setEditingType('multiple_choice');
    setEditingChoices([]);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const shouldHaveChoices = editingType === 'multiple_choice' || editingType === 'true_false';
    if (shouldHaveChoices && !editingChoices.some((choice) => !choice.removed && choice.is_correct)) {
      showToast({ title: 'Correct answer required', description: 'Select the correct answer.', variant: 'error' });
      return;
    }
    await quizService.updateQuestion(editingId, {
      question_text: editingText.trim(),
      points: Number(editingPoints) || 1,
      question_type: editingType,
    });

    if (!shouldHaveChoices) {
      const existing = (editingQuestion?.choices ?? []).map((choice) => choice.id);
      for (const choiceId of existing) {
        await quizService.deleteChoice(choiceId);
      }
    } else {
      for (const choice of editingChoices) {
        if (choice.removed) {
          if (choice.id) {
            await quizService.deleteChoice(choice.id);
          }
          continue;
        }
        const choiceText = choice.text.trim();
        if (!choiceText) continue;
        if (choice.id) {
          await quizService.updateChoice(choice.id, { choice_text: choiceText, is_correct: choice.is_correct });
        } else {
          await quizService.createChoice({ question: editingId, choice_text: choiceText, is_correct: choice.is_correct });
        }
      }
    }
    await refetch();
    cancelEdit();
  };

  const handleDelete = async (questionId: string) => {
    await quizService.deleteQuestion(questionId);
    await refetch();
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    setOrdering((prev) => {
      const base = prev.length ? prev : (quiz?.questions?.map((q) => q.id) ?? []);
      const index = base.indexOf(id);
      if (index < 0) return base;
      const next = [...base];
      const swapIndex = index + direction;
      if (swapIndex < 0 || swapIndex >= next.length) return base;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const handleSaveQuestion = async () => {
    if (!quiz) return;
    if (!questionText.trim()) {
      showToast({ title: 'Question required', description: 'Enter the question text.', variant: 'error' });
      return;
    }
    if ((questionType === 'multiple_choice' || questionType === 'true_false') && !choices.some((choice) => choice.is_correct)) {
      showToast({ title: 'Correct answer required', description: 'Select the correct answer.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      const question = await quizService.createQuestion({
        quiz: quiz.id,
        question_text: questionText.trim(),
        question_type: questionType,
        points: Number(points) || 1,
      });
      if (questionType === 'multiple_choice' || questionType === 'true_false') {
        const filtered = choices.filter((choice) => choice.text.trim());
        for (const choice of filtered) {
          await quizService.createChoice({
            question: question.id,
            choice_text: choice.text.trim(),
            is_correct: choice.is_correct,
          });
        }
      }
      await refetch();
      setQuestionText('');
      setPoints('1');
      setQuestionType('multiple_choice');
      setChoices([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
      showToast({ title: 'Question added', description: 'Question saved successfully.', variant: 'success' });
    } catch (error: any) {
      showToast({ title: 'Save failed', description: error?.message ?? 'Unable to add question.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Quiz Manager" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title={quiz?.title ?? 'Quiz Manager'}
          description="Add and manage quiz questions."
          actions={
            quiz?.security_level ? <Badge variant="outline">Security: {quiz.security_level}</Badge> : null
          }
        />

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Add question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question</label>
              <textarea
                className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white p-3 text-sm"
                rows={3}
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={questionType}
                  onChange={(event) => setQuestionType(event.target.value as QuestionType)}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="essay">Essay</option>
                  <option value="identification">Identification</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Points</label>
                <Input type="number" min="1" value={points} onChange={(event) => setPoints(event.target.value)} />
              </div>
            </div>

            {(questionType === 'multiple_choice' || questionType === 'true_false') && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Choices</label>
                <div className="space-y-2">
                  {choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-choice"
                        checked={choice.is_correct}
                        onChange={() => setCorrectChoice(index)}
                      />
                      <Input
                        value={choice.text}
                        onChange={(event) =>
                          setChoices((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, text: event.target.value } : item))
                          )
                        }
                        readOnly={questionType === 'true_false'}
                        placeholder={`Choice ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                {questionType === 'multiple_choice' ? (
                  <Button variant="secondary" onClick={addChoice}>
                    Add choice
                  </Button>
                ) : null}
              </div>
            )}

            <Button onClick={handleSaveQuestion} disabled={saving}>
              {saving ? 'Saving…' : 'Save question'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quiz?.questions?.length ? (
              (ordering.length
                ? ordering
                    .map((id) => quiz.questions?.find((q) => q.id === id))
                    .filter(Boolean)
                : quiz.questions
              ).map((question, index) => (
                <div key={question!.id} className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question {index + 1}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => moveQuestion(question!.id, -1)}>
                        ↑
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => moveQuestion(question!.id, 1)}>
                        ↓
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => beginEdit(question!)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(question!.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1 font-semibold text-neutral-900">{question!.question_text}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {question!.question_type} • {question!.points} pts
                  </div>
                  {question!.choices?.length ? (
                    <ul className="mt-2 list-disc pl-4 text-xs text-neutral-600">
                      {question!.choices.map((choice) => (
                        <li key={choice.id}>
                          {choice.choice_text} {choice.is_correct ? '(correct)' : ''}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-neutral-500">No questions yet.</div>
            )}
          </CardContent>
        </Card>

        {editingId ? (
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Edit question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Question</label>
                <textarea
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white p-3 text-sm"
                  rows={3}
                  value={editingText}
                  onChange={(event) => setEditingText(event.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={editingType}
                    onChange={(event) => setEditingType(event.target.value as QuestionType)}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="essay">Essay</option>
                    <option value="identification">Identification</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Points</label>
                  <Input type="number" min="1" value={editingPoints} onChange={(event) => setEditingPoints(event.target.value)} />
                </div>
              </div>
              {(editingType === 'multiple_choice' || editingType === 'true_false') && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Choices</label>
                  <div className="space-y-2">
                    {editingChoices.map((choice, index) =>
                      choice.removed ? null : (
                        <div key={choice.id ?? index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="edit-correct-choice"
                            checked={choice.is_correct}
                            onChange={() => setCorrectEditingChoice(index)}
                          />
                          <Input
                            value={choice.text}
                            onChange={(event) => updateEditingChoice(index, 'text', event.target.value)}
                            placeholder={`Choice ${index + 1}`}
                            readOnly={editingType === 'true_false'}
                          />
                          {editingType === 'multiple_choice' ? (
                            <Button variant="destructive" size="sm" onClick={() => removeEditingChoice(index)}>
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                  {editingType === 'multiple_choice' ? (
                    <Button variant="secondary" onClick={addEditingChoice}>
                      Add choice
                    </Button>
                  ) : null}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
