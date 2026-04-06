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

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [adviserPage, setAdviserPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);

  const { data: advisersRaw, isLoading: isAdvisersLoading, isError: isAdvisersError } = usePublicTeachers({
    search,
    page: adviserPage,
    role: 'adviser',
  });
  const { data: teachersRaw, isLoading: isTeachersLoading, isError: isTeachersError } = usePublicTeachers({
    search,
    page: teacherPage,
    role: 'teacher,instructor',
  });
  const { data: sectionsRaw, isLoading: isSectionsLoading, isError: isSectionsError } = usePublicSections({
    search,
    page: sectionPage,
  });

  const advisersData = advisersRaw as PublicTeacherResponse | undefined;
  const teachersData = teachersRaw as PublicTeacherResponse | undefined;
  const sectionsData = sectionsRaw as PublicSectionResponse | undefined;

  const advisers = advisersData?.results ?? [];
  const teachers = teachersData?.results ?? [];
  const sections = sectionsData?.results ?? [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="space-y-6">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--brand-gold-muted)', color: 'var(--brand-gold)' }}
          >
            Directory
          </span>
          <h1 className="text-4xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Teachers, advisers, and sections at a glance.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(11,26,53,0.6)' }}>
            Browse the current school roster for quick reference and coordination.
          </p>
          <div className="max-w-md">
            <Input
              placeholder="Search staff or sections"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setAdviserPage(1);
                setTeacherPage(1);
                setSectionPage(1);
              }}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>
                  Advisers
                </div>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Section Advisers</h2>
              </div>
              <div className="space-y-3">
                {isAdvisersLoading ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Loading advisers…
                  </div>
                ) : isAdvisersError ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Unable to load advisers.
                  </div>
                ) : advisers.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    No advisers found.
                  </div>
                ) : (
                  advisers.map((adviser) => (
                    <div key={adviser.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-blue-muted)] text-xs font-semibold text-[var(--brand-blue-deep)]">
                          {adviser.profile_picture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={adviser.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            `${adviser.first_name?.[0] ?? ''}${adviser.last_name?.[0] ?? ''}`.toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            {`${adviser.first_name ?? ''} ${adviser.last_name ?? ''}`.trim()}
                          </div>
                          <div className="mt-0.5 text-xs text-neutral-500">Adviser</div>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Sections: {adviser.sections && adviser.sections.length > 0 ? adviser.sections.map((s) => s.name).join(', ') : '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-neutral-500">
                <span>{advisersData?.count ?? 0} advisers</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdviserPage((prev) => Math.max(1, prev - 1))}
                    disabled={!advisersData?.previous}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdviserPage((prev) => prev + 1)}
                    disabled={!advisersData?.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>
                  Teachers
                </div>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Teaching Staff</h2>
              </div>
              <div className="space-y-3">
                {isTeachersLoading ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Loading teachers…
                  </div>
                ) : isTeachersError ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Unable to load teachers.
                  </div>
                ) : teachers.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    No teachers found.
                  </div>
                ) : (
                  teachers.map((teacher) => {
                    const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
                    return (
                      <div key={teacher.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-blue-muted)] text-xs font-semibold text-[var(--brand-blue-deep)]">
                              {teacher.profile_picture ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={teacher.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
                              ) : (
                                `${teacher.first_name?.[0] ?? ''}${teacher.last_name?.[0] ?? ''}`.toUpperCase()
                              )}
                            </div>
                            <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{name}</div>
                          </div>
                          <Badge variant="outline">{teacher.role}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">Staff</div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-neutral-500">
                <span>{teachersData?.count ?? 0} staff</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTeacherPage((prev) => Math.max(1, prev - 1))}
                    disabled={!teachersData?.previous}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTeacherPage((prev) => prev + 1)}
                    disabled={!teachersData?.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-blue)' }}>
                  Sections
                </div>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Homerooms</h2>
              </div>
              <div className="space-y-3">
                {isSectionsLoading ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Loading sections…
                  </div>
                ) : isSectionsError ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    Unable to load sections.
                  </div>
                ) : sections.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-neutral-500">
                    No sections found.
                  </div>
                ) : (
                  sections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
                      <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{section.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">Adviser: {section.adviser_name || 'TBA'}</div>
                      <div className="mt-1 text-xs text-neutral-500">School year: {section.school_year_name || '—'}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-neutral-500">
                <span>{sectionsData?.count ?? 0} sections</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSectionPage((prev) => Math.max(1, prev - 1))}
                    disabled={!sectionsData?.previous}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSectionPage((prev) => prev + 1)}
                    disabled={!sectionsData?.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
