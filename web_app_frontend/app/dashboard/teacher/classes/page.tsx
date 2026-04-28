'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { TeacherGroupedListSkeleton } from '@/components/layout/TeacherListSkeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { teacherNav } from '@/components/navigation/nav-config';
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';
import { useSectionSubjects } from '@/features/subjects/hooks/useSectionSubjects';
import { School, Users, BookCopy, ClipboardList, HelpCircle, Search } from 'lucide-react';

const CARD_COLORS = ['#0891b2', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0D1282'];

export default function TeacherClassesPage() {
  const { data: sectionSubjects = [], isLoading } = useSectionSubjects();
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const showListSkeleton = useReliableSkeleton(isLoading);

  const sections = useMemo(() => {
    const unique = new Set(sectionSubjects.map((i) => i.section_name || 'Unassigned'));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [sectionSubjects]);

  const filtered = useMemo(() => {
    let result = sectionSubjects;
    if (selectedSection) result = result.filter((i) => (i.section_name || 'Unassigned') === selectedSection);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((i) =>
        [i.subject_name, i.section_name].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return result;
  }, [sectionSubjects, selectedSection, query]);

  const grouped = useMemo(() =>
    Object.entries(
      filtered.reduce<Record<string, typeof sectionSubjects>>((acc, item) => {
        const key = item.section_name || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {})
    ).sort(([a], [b]) => a.localeCompare(b)),
    [filtered]
  );

  return (
    <AppShell title="Teacher Dashboard" subtitle="My Classes" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-8 p-6 lg:p-8">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10" style={{ background: 'var(--brand-blue)' }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-10" />
          <div className="pointer-events-none absolute -bottom-10 right-32 h-40 w-40 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2">
              <School className="h-5 w-5 text-white/70" />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/60">My Classes</span>
            </div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">Assigned Classes</h1>
            <p className="mt-2 text-sm text-white/70">
              {sectionSubjects.length} subject{sectionSubjects.length !== 1 ? 's' : ''} across {sections.length} section{sections.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Search & Filter ── */}
        <Card className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search subject or section…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-[rgba(17,17,17,0.12)] bg-white px-3 text-sm text-neutral-700 sm:w-52"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(query || selectedSection) && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSelectedSection(''); }}
                className="shrink-0 text-xs font-semibold text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
          </CardContent>
        </Card>

        {/* ── Classes ── */}
        {showListSkeleton ? (
          <TeacherGroupedListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 p-16 text-center text-neutral-400">
            <School className="h-8 w-8 opacity-30" />
            <p className="text-sm">{sectionSubjects.length === 0 ? 'No classes assigned yet.' : 'No results match your search.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([sectionName, items]) => (
              <Card key={sectionName} className="border border-[rgba(15,23,42,0.08)] bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{sectionName}</CardTitle>
                    <span className="text-xs text-neutral-400">{items.length} subject{items.length !== 1 ? 's' : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    return (
                      <Link
                        key={item.id}
                        href={`/dashboard/teacher/classes/${item.id}`}
                        className="block rounded-xl border border-[rgba(15,23,42,0.08)] bg-[var(--surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.3)] hover:bg-white hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900 hover:text-[var(--brand-blue-deep)]">
                              {item.subject_name}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                                style={{ background: `${color}18`, color }}
                              >
                                {item.section_name || 'Unassigned'}
                              </span>
                              {item.term_label && (
                                <span className="text-xs text-neutral-400">{item.term_label}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.preventDefault()}>
                            <Link
                              href={`/dashboard/teacher/classes/${item.id}/students`}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                            >
                              <Users className="h-3 w-3" /> Students
                            </Link>
                            <Link
                              href={`/dashboard/teacher/classes/${item.id}?tab=lessons`}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                            >
                              <BookCopy className="h-3 w-3" /> Learning Materials
                            </Link>
                            <Link
                              href={`/dashboard/teacher/classes/${item.id}?tab=assignments`}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                            >
                              <ClipboardList className="h-3 w-3" /> Assignments
                            </Link>
                            <Link
                              href={`/dashboard/teacher/classes/${item.id}?tab=quizzes`}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs font-semibold text-[var(--brand-blue-deep)] hover:bg-[rgba(15,23,42,0.05)]"
                            >
                              <HelpCircle className="h-3 w-3" /> Quizzes
                            </Link>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}
