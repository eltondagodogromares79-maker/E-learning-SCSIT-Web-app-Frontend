'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { teacherNav } from '@/components/navigation/nav-config';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { useToast } from '@/components/ui/toast';
import { FileText, Calendar, BookOpen, ArrowLeft, ExternalLink } from 'lucide-react';

export default function TeacherLessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { showToast } = useToast();

  const { data: lesson } = useLesson(lessonId);

  const handleOpen = async () => {
    if (!lesson) return;
    if (lesson.content_type === 'text' && !lesson.file_url) {
      showToast({ title: 'No PDF attached', description: 'This material is text-only.', variant: 'info' });
      return;
    }
    try {
      if (lesson.content_type === 'pdf') {
        window.open(`/dashboard/teacher/lessons/${lessonId}/pdf`, '_blank');
        return;
      }

      if (lesson.file_url) {
        window.open(lesson.file_url, '_blank', 'noopener,noreferrer');
        return;
      }

      showToast({ title: 'No file attached', description: 'This material has no file to open.', variant: 'info' });
    } catch {
      showToast({ title: 'Open failed', description: 'Unable to open the PDF.', variant: 'error' });
    }
  };

  const typeIcon: Record<string, string> = {
    pdf: '📄', video: '🎬', text: '📝', link: '🔗', image: '🖼️',
  };

  return (
    <AppShell title="Teacher Dashboard" subtitle="Learning Material" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">

        {/* breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Link href="/dashboard/teacher/lessons" className="font-medium text-[var(--brand-blue-deep)] hover:underline">
            Learning Materials
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-medium text-neutral-700">{lesson?.title ?? 'Detail'}</span>
        </nav>

        {!lesson ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
            Loading material…
          </div>
        ) : (
          <>
            {/* hero card */}
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
                  <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
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
              {/* main */}
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
                    <Button variant="secondary" as={Link} href="/dashboard/teacher/lessons">
                        <ArrowLeft className="h-4 w-4" />
                        Back to materials
                      </Button>
                  </div>
                </CardContent>
              </Card>

              {/* meta sidebar */}
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
          </>
        )}
      </div>
    </AppShell>
  );
}
