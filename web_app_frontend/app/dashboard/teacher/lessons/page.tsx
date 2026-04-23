'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { BookCopy } from 'lucide-react';
import { useAiGenerateLesson } from '@/features/lessons/hooks/useAiGenerateLesson';
import { useAiSaveLesson } from '@/features/lessons/hooks/useAiSaveLesson';
import { useCreateLesson } from '@/features/lessons/hooks/useCreateLesson';
import { useDeleteLesson } from '@/features/lessons/hooks/useDeleteLesson';
import { useToast } from '@/components/ui/toast';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useConfirm } from '@/components/ui/confirm';

function TeacherLessonsPageInner() {
  const { data: lessons = [] } = useLessons();
  const { data: sectionSubjects = [] } = useSectionSubjects();
  const aiGenerate = useAiGenerateLesson();
  const aiSave = useAiSaveLesson();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const [sectionSubjectId, setSectionSubjectId] = useState('');
  const [lessonType, setLessonType] = useState<'text' | 'pdf'>('text');
  const [prompt, setPrompt] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [aiDraftTitle, setAiDraftTitle] = useState('');
  const [aiDraftDescription, setAiDraftDescription] = useState('');
  const [aiDraftType, setAiDraftType] = useState<'text' | 'pdf'>('text');
  const [aiDraftFileUrl, setAiDraftFileUrl] = useState('');
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualType, setManualType] = useState<'text' | 'pdf' | 'link' | 'video'>('text');
  const [manualFileUrl, setManualFileUrl] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'pdf' | 'link' | 'video'>('all');

  useEffect(() => {
    if (sectionSubjectId) return;
    const fromUrl = searchParams.get('sectionSubjectId');
    if (fromUrl) {
      setSectionSubjectId(fromUrl);
    }
  }, [searchParams, sectionSubjectId]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLessons = lessons.filter((lesson) => {
    const matchesType = typeFilter === 'all' || lesson.content_type === typeFilter;
    if (!normalizedSearch) return matchesType;
    const haystack = [
      lesson.title,
      lesson.subject_name,
      lesson.description ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return matchesType && haystack.includes(normalizedSearch);
  });

  const handleGenerate = async () => {
    if (!sectionSubjectId || !prompt.trim()) return;
    const draft = await aiGenerate.mutateAsync({
      section_subject: sectionSubjectId,
      prompt: prompt.trim(),
      type: lessonType,
      file_url: resourceUrl.trim() || undefined,
    });
    if (draft) {
      setAiDraftTitle(draft.title);
      setAiDraftDescription(draft.description);
      setAiDraftType(draft.type);
      setAiDraftFileUrl(draft.file_url ?? '');
      setAiPreviewOpen(true);
    }
    setPrompt('');
    setResourceUrl('');
  };

  const handleAiSave = async () => {
    if (!sectionSubjectId || !aiDraftTitle.trim() || !aiDraftDescription.trim()) return;
    await aiSave.mutateAsync({
      section_subject: sectionSubjectId,
      title: aiDraftTitle.trim(),
      description: aiDraftDescription.trim(),
      type: aiDraftType,
      file_url: aiDraftFileUrl.trim() || undefined,
    });
    setAiDraftTitle('');
    setAiDraftDescription('');
    setAiDraftType('text');
    setAiDraftFileUrl('');
    setAiPreviewOpen(false);
  };

  const handlePreviewPdf = async () => {
    if (!sectionSubjectId || !aiDraftTitle.trim() || !aiDraftDescription.trim()) return;
    const blob = await lessonService.aiPreviewPdf({
      section_subject: sectionSubjectId,
      title: aiDraftTitle.trim(),
      description: aiDraftDescription.trim(),
      file_url: aiDraftFileUrl.trim() || undefined,
    });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleManualSave = async () => {
    if (!sectionSubjectId || !manualTitle.trim()) return;
    if (manualType === 'pdf' && !manualFile) {
      showToast({ title: 'PDF required', description: 'Upload a PDF file or use AI to generate it.', variant: 'error' });
      return;
    }

    if (manualFile) {
      const form = new FormData();
      form.append('section_subject', sectionSubjectId);
      form.append('title', manualTitle.trim());
      form.append('description', manualDescription.trim());
      form.append('type', manualType);
      if (manualFileUrl.trim()) {
        form.append('file_url', manualFileUrl.trim());
      }
      form.append('file', manualFile);
      await createLesson.mutateAsync(form);
    } else {
      await createLesson.mutateAsync({
        section_subject: sectionSubjectId,
        title: manualTitle.trim(),
        description: manualDescription.trim(),
        type: manualType,
        file_url: manualFileUrl.trim() || undefined,
      });
    }

    setManualTitle('');
    setManualDescription('');
    setManualFileUrl('');
    setManualFile(null);
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Learning materials" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Learning Materials</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Learning Materials</h1>
            <p className="mt-2 text-sm text-white/70">{lessons.length} material{lessons.length !== 1 ? 's' : ''} published · AI or manual creation</p>
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
            {createMode === 'ai' ? 'Generate a draft with AI' : 'Create a learning material yourself'}
          </div>
        </div>

        {createMode === 'ai' ? (
          <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>AI learning material request</CardTitle>
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
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Material type</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={lessonType}
                  onChange={(event) => setLessonType(event.target.value as 'text' | 'pdf')}
                >
                  <option value="text">Text</option>
                  <option value="pdf">PDF (text draft)</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Prompt</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  placeholder="Example: Create a learning material about cellular respiration for Grade 10 with a short activity."
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Resource URL (optional)
                </label>
                <Input
                  placeholder="Paste a link if you want the material to reference a specific resource."
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <Button onClick={handleGenerate} disabled={aiGenerate.isPending || !sectionSubjectId || !prompt.trim()}>
                  {aiGenerate.isPending ? 'Generating…' : 'Generate material'}
                </Button>
                {aiDraftTitle ? (
                  <span className="text-xs text-neutral-500">Draft ready below. Review before saving.</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {createMode === 'ai' ? (
          <Dialog open={aiPreviewOpen} onOpenChange={setAiPreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI learning material preview</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                  <Input value={aiDraftTitle} onChange={(event) => setAiDraftTitle(event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                  <textarea
                    rows={8}
                    className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                    value={aiDraftDescription}
                    onChange={(event) => setAiDraftDescription(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                  <select
                    className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                    value={aiDraftType}
                    onChange={(event) => setAiDraftType(event.target.value as 'text' | 'pdf')}
                  >
                    <option value="text">Text</option>
                    <option value="pdf">PDF (text draft)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Resource URL (optional)</label>
                  <Input value={aiDraftFileUrl} onChange={(event) => setAiDraftFileUrl(event.target.value)} />
                </div>
              </div>
              <DialogFooter>
                {aiDraftType === 'pdf' ? (
                  <Button variant="outline" onClick={handlePreviewPdf}>
                    Preview PDF
                  </Button>
                ) : null}
                <Button onClick={handleAiSave} disabled={aiSave.isPending || !aiDraftTitle.trim()}>
                  {aiSave.isPending ? 'Saving…' : 'Save material'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiPreviewOpen(false);
                    setAiDraftTitle('');
                    setAiDraftDescription('');
                    setAiDraftType('text');
                    setAiDraftFileUrl('');
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
              <CardTitle>Manual learning material</CardTitle>
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
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Material type</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={manualType}
                  onChange={(event) => setManualType(event.target.value as 'text' | 'pdf' | 'link' | 'video')}
                >
                  <option value="text">Text</option>
                  <option value="pdf">PDF (upload)</option>
                  <option value="link">External link</option>
                  <option value="video">Video link</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Title</label>
                <Input
                  placeholder="Material title"
                  value={manualTitle}
                  onChange={(event) => setManualTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Description</label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 py-2 text-sm text-neutral-700"
                  placeholder="Write material summary or content"
                  value={manualDescription}
                  onChange={(event) => setManualDescription(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Resource URL (optional)</label>
                <Input
                  placeholder="Paste a link if needed"
                  value={manualFileUrl}
                  onChange={(event) => setManualFileUrl(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Attachment (optional)</label>
                <input
                  type="file"
                  onChange={(event) => setManualFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-700"
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleManualSave} disabled={createLesson.isPending || !manualTitle.trim() || !sectionSubjectId}>
                  {createLesson.isPending ? 'Saving…' : 'Save material'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Recent learning materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1.4fr,0.6fr]">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Search</label>
                <Input
                  placeholder="Search by title, subject, or description"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">Type</label>
                <select
                  className="h-10 w-full rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
                >
                  <option value="all">All types</option>
                  <option value="text">Text</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            {filteredLessons.length === 0 ? (
              <div className="text-sm text-neutral-500">No learning materials yet.</div>
            ) : (
              filteredLessons.slice(0, 6).map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--brand-blue-deep)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-neutral-900">{lesson.title}</div>
                    <Badge variant="outline">{lesson.content_type.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    {lesson.subject_name} • Added {new Date(lesson.created_at).toLocaleDateString()}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button as={Link} href={`/dashboard/teacher/lessons/${lesson.id}`} size="sm" variant="outline">
                      View material
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="border border-red-900 bg-red-700 text-white hover:bg-red-800"
                      style={{ background: '#dc2626', borderColor: '#991b1b', color: '#fff' }}
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete learning material?',
                          description: 'This will remove the learning material from the class.',
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                          danger: true,
                        });
                        if (!ok) return;
                        await deleteLesson.mutateAsync(lesson.id);
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
      </div>
    </AppShell>
  );
}

export default function TeacherLessonsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <TeacherLessonsPageInner />
    </Suspense>
  );
}
