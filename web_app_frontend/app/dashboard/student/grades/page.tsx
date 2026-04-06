'use client';

import { motion } from 'framer-motion';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { studentNav } from '@/components/navigation/nav-config';
import { useGrades } from '@/features/grades/hooks/useGrades';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';

export default function StudentGradesPage() {
  const { data: grades = [] } = useGrades();
  const { data: subjects = [] } = useSubjects();
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.code, subject.name]));

  return (
    <AppShell title="Student Dashboard" subtitle="Grades" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Grades" description="Review your grading periods and remarks." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Term average', value: '91%', note: 'Above target' },
            { label: 'Highest grade', value: '94', note: 'Science Explorations' },
            { label: 'Improvement', value: '+4%', note: 'Since last term' },
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
          <Input placeholder="Search grades" className="md:w-72" />
          <div className="flex flex-wrap gap-2">
            <Badge>Current term</Badge>
            <Badge variant="outline">Midterm</Badge>
            <Badge variant="outline">Final</Badge>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Recent grades</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>{subjectLookup[grade.subject_code] ?? grade.subject_code}</TableCell>
                        <TableCell>{grade.school_year ?? '—'}</TableCell>
                        <TableCell>{grade.grade}</TableCell>
                        <TableCell>{grade.remarks ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Strength areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                {['Science labs', 'Essay structure', 'Problem solving'].map((item) => (
                  <div key={item} className="rounded-xl border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Next goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-600">
                <div>Target 95% in Mathematics 10.</div>
                <div>Complete two extra practice sets.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
