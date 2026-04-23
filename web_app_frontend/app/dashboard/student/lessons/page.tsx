'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { studentNav } from '@/components/navigation/nav-config';
import { useLessons } from '@/features/lessons/hooks/useLessons';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useToggleFavorite } from '@/features/lessons/hooks/useToggleFavorite';
import { useFavoriteLessons } from '@/features/lessons/hooks/useFavoriteLessons';
import { Search, BookOpen, FileText, Link2, AlignLeft, ChevronRight, Calendar, Heart } from 'lucide-react';

type TypeFilter = 'all' | 'text' | 'pdf' | 'link' | 'favorites';
type SortOrder = 'newest' | 'oldest';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string; light: string }> = {
  pdf:  { label: 'PDF',  icon: <FileText className="h-5 w-5" />,  color: '#dc2626', light: 'rgba(220,38,38,0.08)'  },
  link: { label: 'Link', icon: <Link2 className="h-5 w-5" />,     color: '#0891b2', light: 'rgba(8,145,178,0.08)'  },
  text: { label: 'Text', icon: <AlignLeft className="h-5 w-5" />, color: '#059669', light: 'rgba(5,150,105,0.08)'  },
};

const FILTERS: { value: TypeFilter; label: string; icon?: React.ReactNode }[] = [
  { value: 'all',       label: 'All' },
  { value: 'favorites', label: 'My Favorites', icon: <Heart className="h-3.5 w-3.5" /> },
  { value: 'pdf',       label: 'PDF' },
  { value: 'link',      label: 'Link' },
  { value: 'text',      label: 'Text' },
];

export default function StudentLessonsPage() {
  const { data: lessons = [] } = useLessons();
  const { data: subjects = [] } = useSubjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const subjectLookup = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const toggleFavorite = useToggleFavorite();
  const { data: favorites = [] } = useFavoriteLessons();
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const [sectionFilter, setSectionFilter] = useState('');

  const sections = useMemo(() => {
    const names = new Set(lessons.map((l) => l.subject_name ?? subjectLookup[l.subject_id] ?? '').filter(Boolean));
    return Array.from(names).sort();
  }, [lessons, subjectLookup]);

  const filteredLessons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const source = typeFilter === 'favorites' ? favorites : lessons;
    return [...source]
      .filter((lesson) => {
        const subjectName = lesson.subject_name ?? subjectLookup[lesson.subject_id] ?? '';
        const matchesType = typeFilter === 'all' || typeFilter === 'favorites' || lesson.content_type === typeFilter;
        const matchesSection = !sectionFilter || subjectName === sectionFilter;
        if (!q) return matchesType && matchesSection;
        const haystack = [lesson.title, subjectName].join(' ').toLowerCase();
        return matchesType && matchesSection && haystack.includes(q);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at).getTime();
        const rightTime = new Date(right.created_at).getTime();
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [lessons, favorites, sortOrder, typeFilter, searchTerm, subjectLookup, sectionFilter]);

  return (
    <AppShell title="Student Dashboard" subtitle="Learning Materials" navItems={studentNav} requiredRole="student">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-white/70" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Learning Materials</span>
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">Your Learning Materials</h1>
              <p className="mt-2 text-sm text-white/70">
                {lessons.length} material{lessons.length !== 1 ? 's' : ''} available
              </p>
            </div>
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search learning materials or subjects…"
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:bg-white/15"
              />
            </div>
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
              style={
                typeFilter === f.value
                  ? { background: f.value === 'favorites' ? '#dc2626' : 'var(--brand-blue)', color: '#fff', borderColor: f.value === 'favorites' ? '#dc2626' : 'var(--brand-blue)' }
                  : { background: 'var(--surface)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
              }
            >
              {f.icon}
              {f.label}
            </button>
          ))}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
            style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
          >
            <option value="newest">Newest uploaded</option>
            <option value="oldest">Oldest uploaded</option>
          </select>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-full border px-4 py-1.5 text-sm font-semibold outline-none"
            style={{ background: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
          >
            <option value="">All Subjects</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="ml-auto text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {filteredLessons.length} result{filteredLessons.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Cards ── */}
        {filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border p-16 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted-foreground)' }}>
            <BookOpen className="h-8 w-8 opacity-30" />
            <p className="text-sm">No learning materials found.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredLessons.map((lesson) => {
              const meta = TYPE_META[lesson.content_type] ?? TYPE_META.text;
              const subjectName = lesson.subject_name ?? subjectLookup[lesson.subject_id] ?? 'General';
              return (
                <motion.div key={lesson.id} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="h-full">
                  <Link
                    href={`/dashboard/student/lessons/${lesson.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
                  >
                    {/* Colored top bar */}
                    <div className="h-1.5 w-full" style={{ background: meta.color }} />

                    <div className="flex flex-1 flex-col p-6">
                      {/* Icon + type */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: meta.light, color: meta.color }}>
                          {meta.icon}
                        </div>
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                          style={{ background: meta.light, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Subject */}
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                        {subjectName}
                      </p>

                      {/* Title */}
                      <h3 className="mb-3 flex-1 text-base font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
                        {lesson.title}
                      </h3>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(lesson.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite.mutate(lesson.id); }}
                            className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-[var(--surface-2)]"
                            title={favoriteIds.has(lesson.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart
                              className="h-4 w-4"
                              style={{ color: favoriteIds.has(lesson.id) ? '#dc2626' : 'var(--muted-foreground)', fill: favoriteIds.has(lesson.id) ? '#dc2626' : 'none' }}
                            />
                          </button>
                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: meta.color }}>
                            Open <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
