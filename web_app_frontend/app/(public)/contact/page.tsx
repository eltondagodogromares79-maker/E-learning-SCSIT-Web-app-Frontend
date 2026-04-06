'use client';

import { PublicNav } from '@/components/navigation/PublicNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePublicTeachers } from '@/features/teachers/hooks/usePublicTeachers';
import { usePublicSections } from '@/features/sections/hooks/usePublicSections';
import type { PublicTeacherResponse } from '@/features/teachers/services/publicTeacherService';
import type { PublicSectionResponse } from '@/features/sections/services/publicSectionService';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Users, BookOpen, LayoutGrid } from 'lucide-react';

function Avatar({ person }: { person: { first_name?: string; last_name?: string; profile_picture?: string | null } }) {
  const initials = `${person.first_name?.[0] ?? ''}${person.last_name?.[0] ?? ''}`.toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white"
      style={{ background: 'linear-gradient(135deg, #2f6ff6, #1a3a8f)' }}
    >
      {person.profile_picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
      ) : initials}
    </div>
  );
}

function Pagination({
  count,
  label,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  count: number;
  label: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>{count} {label}</span>
      <div className="flex gap-1.5">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
        >
          <ChevronLeft className="h-3.5 w-3.5" style={{ color: 'rgba(11,26,53,0.6)' }} />
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
          style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
        >
          <ChevronRight className="h-3.5 w-3.5" style={{ color: 'rgba(11,26,53,0.6)' }} />
        </button>
      </div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center text-xs"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'rgba(11,26,53,0.45)' }}
    >
      {message}
    </div>
  );
}

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [adviserPage, setAdviserPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);

  const { data: advisersRaw, isLoading: isAdvisersLoading, isError: isAdvisersError } = usePublicTeachers({ search, page: adviserPage, role: 'adviser' });
  const { data: teachersRaw, isLoading: isTeachersLoading, isError: isTeachersError } = usePublicTeachers({ search, page: teacherPage, role: 'teacher,instructor' });
  const { data: sectionsRaw, isLoading: isSectionsLoading, isError: isSectionsError } = usePublicSections({ search, page: sectionPage });

  const advisersData = advisersRaw as PublicTeacherResponse | undefined;
  const teachersData = teachersRaw as PublicTeacherResponse | undefined;
  const sectionsData = sectionsRaw as PublicSectionResponse | undefined;

  const advisers = advisersData?.results ?? [];
  const teachers = teachersData?.results ?? [];
  const sections = sectionsData?.results ?? [];

  const handleSearch = (val: string) => {
    setSearch(val);
    setAdviserPage(1);
    setTeacherPage(1);
    setSectionPage(1);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />

      {/* Hero header */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 left-0 h-[300px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(47,111,246,0.35) 0%, transparent 70%)' }}
        />
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue-deep)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
                Directory
              </span>
              <h1 className="text-4xl font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                Teachers, advisers &amp; sections
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
                Browse the current school roster for quick reference and coordination.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(11,26,53,0.35)' }} />
              <Input
                placeholder="Search staff or sections…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Advisers */}
          <Card style={{ border: '1px solid var(--border)' }}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue)' }}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Advisers</div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Section Advisers</h2>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {isAdvisersLoading ? <EmptyRow message="Loading advisers…" /> :
                  isAdvisersError ? <EmptyRow message="Unable to load advisers." /> :
                  advisers.length === 0 ? <EmptyRow message="No advisers found." /> :
                  advisers.map((adviser) => (
                    <div
                      key={adviser.id}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <Avatar person={adviser} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {`${adviser.first_name ?? ''} ${adviser.last_name ?? ''}`.trim()}
                        </div>
                        <div className="mt-0.5 truncate text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>
                          {adviser.sections?.length ? adviser.sections.map((s) => s.name).join(', ') : 'No section assigned'}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              <Pagination
                count={advisersData?.count ?? 0}
                label="advisers"
                hasPrev={!!advisersData?.previous}
                hasNext={!!advisersData?.next}
                onPrev={() => setAdviserPage((p) => Math.max(1, p - 1))}
                onNext={() => setAdviserPage((p) => p + 1)}
              />
            </CardContent>
          </Card>

          {/* Teachers */}
          <Card style={{ border: '1px solid var(--border)' }}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-blue)' }}
                >
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Teachers</div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Teaching Staff</h2>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {isTeachersLoading ? <EmptyRow message="Loading teachers…" /> :
                  isTeachersError ? <EmptyRow message="Unable to load teachers." /> :
                  teachers.length === 0 ? <EmptyRow message="No teachers found." /> :
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between gap-3 rounded-xl p-3"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar person={teacher} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {`${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim()}
                          </div>
                          <div className="mt-0.5 text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>Staff</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">{teacher.role}</Badge>
                    </div>
                  ))
                }
              </div>

              <Pagination
                count={teachersData?.count ?? 0}
                label="staff"
                hasPrev={!!teachersData?.previous}
                hasNext={!!teachersData?.next}
                onPrev={() => setTeacherPage((p) => Math.max(1, p - 1))}
                onNext={() => setTeacherPage((p) => p + 1)}
              />
            </CardContent>
          </Card>

          {/* Sections */}
          <Card style={{ border: '1px solid var(--border)' }}>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue)' }}
                >
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>Sections</div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>Homerooms</h2>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {isSectionsLoading ? <EmptyRow message="Loading sections…" /> :
                  isSectionsError ? <EmptyRow message="Unable to load sections." /> :
                  sections.length === 0 ? <EmptyRow message="No sections found." /> :
                  sections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-xl p-3"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{section.name}</div>
                        {section.school_year_name && (
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: 'var(--brand-blue-muted)', color: 'var(--brand-blue-deep)' }}
                          >
                            {section.school_year_name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: 'rgba(11,26,53,0.45)' }}>
                        Adviser: {section.adviser_name || 'TBA'}
                      </div>
                    </div>
                  ))
                }
              </div>

              <Pagination
                count={sectionsData?.count ?? 0}
                label="sections"
                hasPrev={!!sectionsData?.previous}
                hasNext={!!sectionsData?.next}
                onPrev={() => setSectionPage((p) => Math.max(1, p - 1))}
                onNext={() => setSectionPage((p) => p + 1)}
              />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
