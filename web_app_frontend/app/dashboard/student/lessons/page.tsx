'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentNav } from '@/components/navigation/nav-config';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';

export default function StudentLessonsPage() {
  const { data: lessons = [] } = useLessons();
  const { data: subjects = [] } = useSubjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'pdf' | 'link' | 'video'>('all');
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.id, subject.name]));
  const publishedCount = lessons.length;
  const lastWeekThreshold = new Date();
  lastWeekThreshold.setDate(lastWeekThreshold.getDate() - 7);
  const recentCount = lessons.filter((lesson) => {
    const created = new Date(lesson.created_at);
    return !Number.isNaN(created.getTime()) && created >= lastWeekThreshold;
  }).length;
  const savedItems = lessons.filter((lesson) => Boolean(lesson.file_url)).length;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesType = typeFilter === 'all' || lesson.content_type === typeFilter;
      if (!normalizedSearch) return matchesType;
      const haystack = [
        lesson.title,
        lesson.subject_name ?? subjectLookup[lesson.subject_id] ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return matchesType && haystack.includes(normalizedSearch);
    });
  }, [lessons, typeFilter, normalizedSearch, subjectLookup]);

  return (
    <AppShell title="Student Dashboard" subtitle="Lessons" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Lessons" description="Review published lessons and learning resources." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Published', value: `${publishedCount}`, note: `${recentCount} added this week` },
            { label: 'Resources with files', value: `${savedItems}`, note: 'Lessons with attachments' },
            { label: 'Subjects covered', value: `${subjects.length}`, note: 'Lessons across your subjects' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                <div className="mt-1 text-xs text-neutral-500">{stat.note}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(17,17,17,0.12)] bg-white p-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search lessons"
            className="md:w-72"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            >
              <option value="all">All types</option>
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="link">Link</option>
              <option value="video">Video</option>
            </select>
            <Badge variant="outline">{filteredLessons.length} results</Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredLessons.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                No lessons found.
              </div>
            ) : (
              filteredLessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{lesson.title}</CardTitle>
                      <Link href={`/dashboard/student/lessons/${lesson.id}`} className="text-xs text-neutral-700 hover:underline">
                        View
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-neutral-600">
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {lesson.subject_name ?? subjectLookup[lesson.subject_id] ?? 'General'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lesson.content_type.toUpperCase()}</Badge>
                        <Badge variant="muted">Uploaded</Badge>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Added {new Date(lesson.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Continue learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {['Linear Equations Refresher', 'Persuasive Writing Basics'].map((item) => (
                  <div key={item} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                    {item}
                  </div>
                ))}
                <Button size="sm">Resume last lesson</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Study tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div>Set a 20-minute focus timer.</div>
                <div>Review key terms after each lesson.</div>
                <div>Save summaries to your notes.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
