'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { lessonService } from '@/features/lessons/services/lessonService';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { Button } from '@/components/ui/button';

export default function TeacherLessonPdfPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { data: lesson } = useLesson(lessonId);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function loadPdf() {
      try {
        const blob = await lessonService.download(lessonId);
        if (!active) return;
        const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(objectUrl);
      } catch {
        if (!active) return;
        setError('Unable to load this PDF.');
      }
    }

    loadPdf();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [lessonId]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-neutral-900/95 px-4 py-3 text-white">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">Teacher PDF Viewer</div>
          <div className="text-sm font-semibold">{lesson?.title ?? 'Loading PDF…'}</div>
        </div>
        <Button as={Link} href={`/dashboard/teacher/lessons/${lessonId}`} variant="outline" size="sm" className="text-white">
          Back to material
        </Button>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-5 text-sm text-red-100">
            {error}
          </div>
        </div>
      ) : blobUrl ? (
        <iframe title={lesson?.title ?? 'PDF viewer'} src={blobUrl} className="h-[calc(100vh-65px)] w-full border-0 bg-white" />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-white/70">Loading PDF…</div>
      )}
    </div>
  );
}
