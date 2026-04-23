'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { useToggleFavorite } from '@/features/lessons/hooks/useToggleFavorite';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, FileText, Link2, AlignLeft, Calendar, BookOpen, ExternalLink, Download, Heart } from 'lucide-react';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; light: string }> = {
  pdf:  { label: 'PDF',  icon: <FileText className="h-6 w-6" />,  color: '#dc2626', light: 'rgba(220,38,38,0.08)'  },
  link: { label: 'Link', icon: <Link2 className="h-6 w-6" />,     color: '#0891b2', light: 'rgba(8,145,178,0.08)'  },
  text: { label: 'Text', icon: <AlignLeft className="h-6 w-6" />, color: '#059669', light: 'rgba(5,150,105,0.08)'  },
};

export default function StudentLessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { data: lesson } = useLesson(lessonId);
  const { showToast } = useToast();
  const toggleFavorite = useToggleFavorite();

  const meta = TYPE_META[lesson?.content_type ?? 'text'] ?? TYPE_META.text;

  const handleOpen = async () => {
    if (!lesson) return;
    if (lesson.content_type === 'text' && !lesson.file_url) {
      showToast({ title: 'No file attached', description: 'This material is text-only.', variant: 'info' });
      return;
    }
    try {
      if (lesson.content_type === 'pdf') {
        window.open(`/dashboard/student/lessons/${lessonId}/pdf`, '_blank');
        return;
      }

      if (lesson.file_url) {
        window.open(lesson.file_url, '_blank', 'noopener,noreferrer');
        return;
      }

      showToast({ title: 'No file attached', description: 'This material has no file to open.', variant: 'info' });
    } catch {
      showToast({ title: 'Open failed', description: 'Unable to open the file.', variant: 'error' });
    }
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Learning Material" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Back ── */}
        <Button as={Link} href="/dashboard/student/lessons" variant="ghost" size="sm"
          className="gap-2 -ml-1 text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Materials
        </Button>

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {lesson?.content_type?.toUpperCase() ?? '…'}
                </span>
                {lesson?.subject_name && (
                  <span className="text-sm text-white/60">{lesson.subject_name}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">
                {lesson?.title ?? 'Loading…'}
              </h1>
              {lesson?.created_at && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-white/70">
                  <Calendar className="h-4 w-4" />
                  Added {new Date(lesson.created_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Type icon badge */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm"
              style={{ color: '#fff' }}>
              {meta.icon}
            </div>
          </div>
        </div>

        {!lesson ? (
          <div className="rounded-2xl border p-16 text-center text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            Loading material…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Main content ── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Description */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-6 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Description
                  </h2>
                </div>
                <div className="px-6 py-5 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                  {lesson.description || (
                    <span style={{ color: 'var(--muted-foreground)' }} className="italic">No description provided.</span>
                  )}
                </div>
              </div>

              {/* Image preview */}
              {lesson.content_type === 'image' && lesson.file_url && (
                <div className="overflow-hidden rounded-2xl border"
                  style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                  <img src={lesson.file_url} alt={lesson.title} className="w-full object-cover" />
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">

              {/* Details card */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Details
                  </h2>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Type</span>
                    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ background: meta.light, color: meta.color }}>
                      {meta.icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{meta.icon}</span>}
                      {meta.label}
                    </span>
                  </div>
                  {lesson.subject_name && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Subject</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{lesson.subject_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Added</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action card */}
              <div className="overflow-hidden rounded-2xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
                <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Actions
                  </h2>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {lesson.content_type === 'link' && lesson.file_url ? (
                    <a href={lesson.file_url} target="_blank" rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: meta.color }}>
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                  ) : lesson.content_type !== 'text' ? (
                    <button onClick={handleOpen}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: meta.color }}>
                      <Download className="h-4 w-4" />
                      {`Open ${meta.label}`}
                    </button>
                  ) : null}
                  <button
                    onClick={() => toggleFavorite.mutate(lessonId)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                    style={{
                      borderColor: lesson.is_favorited ? '#dc2626' : 'var(--border)',
                      color: lesson.is_favorited ? '#dc2626' : 'var(--muted-foreground)',
                      background: lesson.is_favorited ? 'rgba(220,38,38,0.06)' : 'transparent',
                    }}
                  >
                    <Heart className="h-4 w-4" style={{ fill: lesson.is_favorited ? '#dc2626' : 'none' }} />
                    {lesson.is_favorited ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                  <Button as={Link} href="/dashboard/student/lessons" variant="outline" size="sm" className="w-full">
                    <BookOpen className="h-4 w-4" />
                    All Materials
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
