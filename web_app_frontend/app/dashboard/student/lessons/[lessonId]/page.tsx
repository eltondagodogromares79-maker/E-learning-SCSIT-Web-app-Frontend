'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useLesson } from '@/features/lessons/hooks/useLesson';
import { useToast } from '@/components/ui/toast';
import { env } from '@/lib/env';

export default function StudentLessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { data: lesson } = useLesson(lessonId);
  const { showToast } = useToast();
  const [isOpening, setIsOpening] = useState(false);
  const apiBase = env.API_BASE_URL;
  const downloadUrl = `${apiBase}/api/learning-materials/${lessonId}/download/`;

  const handleOpen = () => {
    if (!lesson) return;
    if (lesson.content_type === 'text' && !lesson.file_url) {
      showToast({ title: 'No PDF attached', description: 'This lesson is text-only.', variant: 'info' });
      return;
    }
    setIsOpening(true);
    try {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showToast({ title: 'Open failed', description: 'Unable to open the PDF.', variant: 'error' });
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <AppShell title="Student Dashboard" subtitle="Lesson Details" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title={lesson?.title ?? 'Lesson details'}
          description={lesson ? `${lesson.subject_name} • ${lesson.content_type.toUpperCase()}` : 'Review your lesson.'}
        />

        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Lesson overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lesson.content_type.toUpperCase()}</Badge>
                  <div className="text-xs text-neutral-500">
                    Added {new Date(lesson.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-neutral-700">{lesson.description || 'No description provided.'}</div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleOpen} disabled={isOpening}>
                    {isOpening ? 'Opening…' : 'View PDF'}
                  </Button>
                  <Link
                    href="/dashboard/student/lessons"
                    className="inline-flex items-center rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                  >
                    Back to lessons
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-sm text-neutral-500">Loading lesson…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
