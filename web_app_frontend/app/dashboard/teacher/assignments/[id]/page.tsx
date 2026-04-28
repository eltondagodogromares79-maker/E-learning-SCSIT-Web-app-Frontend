'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { TeacherStudentRowsSkeleton } from '@/components/layout/TeacherListSkeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { teacherNav } from '@/components/navigation/nav-config';
import { useAssignments } from '@/features/assignments/hooks/useAssignments';
import { useAssignmentSubmissions } from '@/features/assignments/hooks/useAssignmentSubmissions';
import { useAiGradeSubmission } from '@/features/assignments/hooks/useAiGradeSubmission';
import { useGradeSubmission } from '@/features/assignments/hooks/useGradeSubmission';
import { useReliableSkeleton } from '@/features/shared/hooks/useReliableSkeleton';
import { ClipboardList, Calendar, Star, Search, Trophy } from 'lucide-react';

type DraftMap = Record<string, { score: string; feedback: string }>;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function avatarColor(name: string) {
  const palette = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  return palette[name.charCodeAt(0) % palette.length];
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams();
  const assignmentId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: submissions = [], isLoading: submissionsLoading } = useAssignmentSubmissions();
  const aiGrade = useAiGradeSubmission();
  const manualGrade = useGradeSubmission();
  const showSubmissionSkeleton = useReliableSkeleton(assignmentsLoading || submissionsLoading);

  const assignment = assignments.find((item) => item.id === assignmentId);
  const filteredSubmissions = submissions.filter((item) => item.assignment_id === assignmentId);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [timelinessFilter, setTimelinessFilter] = useState<'all' | 'late' | 'on_time'>('all');
  const [reviewSubmissionId, setReviewSubmissionId] = useState<string | null>(null);

  const getDraft = (id: string) => drafts[id] ?? { score: '', feedback: '' };
  const setDraft = (id: string, patch: Partial<DraftMap[string]>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...getDraft(id), ...patch } }));
  };

  const getStatus = (submittedAt?: string) => {
    if (!submittedAt || !assignment) return { label: 'Pending', color: 'bg-neutral-100 text-neutral-600' };
    const due = new Date(assignment.due_date);
    const submitted = new Date(submittedAt);
    if (!Number.isNaN(due.getTime()) && !Number.isNaN(submitted.getTime()) && submitted > due)
      return { label: 'Late', color: 'bg-rose-100 text-rose-700' };
    return { label: 'On time', color: 'bg-emerald-100 text-emerald-700' };
  };

  const loweredSearch = submissionSearch.trim().toLowerCase();
  const gradedSubmissions = filteredSubmissions.filter((s) => s.score !== undefined && s.score !== null);
  const topRankings = [...gradedSubmissions]
    .filter((s) => typeof s.score === 'number')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  const filteredByScore =
    submissionFilter === 'graded' ? gradedSubmissions
    : submissionFilter === 'ungraded' ? filteredSubmissions.filter((s) => s.score === undefined || s.score === null)
    : filteredSubmissions;

  const filteredByTime =
    timelinessFilter === 'late'
      ? filteredByScore.filter((s) => { if (!assignment?.due_date) return false; const sub = new Date(s.submitted_at); const due = new Date(assignment.due_date); return !Number.isNaN(sub.getTime()) && !Number.isNaN(due.getTime()) && sub > due; })
    : timelinessFilter === 'on_time'
      ? filteredByScore.filter((s) => { if (!assignment?.due_date) return false; const sub = new Date(s.submitted_at); const due = new Date(assignment.due_date); return !Number.isNaN(sub.getTime()) && !Number.isNaN(due.getTime()) && sub <= due; })
    : filteredByScore;

  const searchedSubmissions = loweredSearch
    ? filteredByTime.filter((s) => `${s.student_name ?? ''} ${s.student_id ?? ''}`.toLowerCase().includes(loweredSearch))
    : filteredByTime;

  const activeSubmission = filteredSubmissions.find((s) => s.id === reviewSubmissionId) ?? null;

  const statCards = [
    { label: 'Total', value: filteredSubmissions.length, icon: '📋', color: 'text-[var(--brand-blue-deep)]', bg: 'from-blue-50 to-white border-blue-100' },
    { label: 'Graded', value: gradedSubmissions.length, icon: '✅', color: 'text-emerald-700', bg: 'from-emerald-50 to-white border-emerald-100' },
    { label: 'Ungraded', value: filteredSubmissions.length - gradedSubmissions.length, icon: '⏳', color: 'text-amber-700', bg: 'from-amber-50 to-white border-amber-100' },
    { label: 'Total Points', value: assignment?.total_points ?? '—', icon: '🏆', color: 'text-violet-700', bg: 'from-violet-50 to-white border-violet-100' },
  ];

  return (
    <AppShell title="Teacher Dashboard" subtitle="Assignment" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">

        {showSubmissionSkeleton ? (
          <TeacherStudentRowsSkeleton count={4} />
        ) : !assignment ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">Assignment not found.</div>
        ) : (
          <>
            {/* hero */}
            <div className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--brand-blue)' }}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white opacity-10" />
              <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white opacity-5" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-white/70" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Assignment</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{assignment.title}</h1>
                  <p className="mt-1 text-sm text-white/70">{assignment.subject_name}</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50">Due</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((card) => (
                <div key={card.label} className={`rounded-2xl border bg-gradient-to-br ${card.bg} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400">{card.label}</span>
                    <span className="text-base">{card.icon}</span>
                  </div>
                  <div className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
              {/* submissions */}
              <div className="space-y-4">
                {/* filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      placeholder="Search student…"
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
                    {(['all', 'graded', 'ungraded'] as const).map((f) => (
                      <button key={f} onClick={() => setSubmissionFilter(f)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors capitalize ${submissionFilter === f ? 'bg-[var(--brand-blue-deep)] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
                    {(['all', 'on_time', 'late'] as const).map((f) => (
                      <button key={f} onClick={() => setTimelinessFilter(f)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${timelinessFilter === f ? 'bg-[var(--brand-blue-deep)] text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                        {f === 'on_time' ? 'On time' : f === 'late' ? 'Late' : 'All'}
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto text-xs text-neutral-400">{searchedSubmissions.length} result{searchedSubmissions.length !== 1 ? 's' : ''}</span>
                </div>

                {showSubmissionSkeleton ? (
                  <TeacherStudentRowsSkeleton count={4} />
                ) : searchedSubmissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
                    {loweredSearch ? 'No matches.' : 'No submissions yet.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchedSubmissions.map((submission) => {
                      const status = getStatus(submission.submitted_at);
                      return (
                        <Card key={submission.id} className="overflow-hidden border border-neutral-200/80 shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(submission.student_name ?? 'S')}`}>
                                  {initials(submission.student_name ?? 'Student')}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-neutral-900">{submission.student_name ?? 'Student'}</div>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                                    <span className="text-[11px] text-neutral-400">
                                      {new Date(submission.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-[10px] uppercase tracking-widest text-neutral-400">Score</div>
                                  <div className={`text-lg font-bold ${submission.score != null ? 'text-[var(--brand-blue-deep)]' : 'text-neutral-400'}`}>
                                    {submission.score ?? '—'}
                                    {submission.score != null && <span className="text-xs font-normal text-neutral-400">/{assignment.total_points}</span>}
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => setReviewSubmissionId(submission.id)}>
                                  Review
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* sidebar — top scores + overview */}
              <div className="space-y-4">
                <Card className="border border-neutral-200/80 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-semibold text-neutral-700">Top Scores</span>
                    </div>
                    {topRankings.length === 0 ? (
                      <p className="text-xs text-neutral-400">No graded submissions yet.</p>
                    ) : (
                      topRankings.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-400' : 'text-neutral-300'}`}>
                              #{i + 1}
                            </span>
                            <span className="text-sm font-medium text-neutral-800">{s.student_name ?? 'Student'}</span>
                          </div>
                          <span className="text-sm font-bold text-[var(--brand-blue-deep)]">{s.score}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-neutral-200/80 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-[var(--brand-blue-deep)]" />
                      <span className="text-sm font-semibold text-neutral-700">Overview</span>
                    </div>
                    {[
                      { label: 'Subject', value: assignment.subject_name },
                      { label: 'Due date', value: new Date(assignment.due_date).toLocaleString() },
                      { label: 'Total points', value: String(assignment.total_points) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-neutral-400">{item.label}</span>
                        <span className="font-medium text-neutral-800 text-right">{item.value}</span>
                      </div>
                    ))}
                    {assignment.description && (
                      <p className="text-xs text-neutral-500 border-t border-neutral-100 pt-3">{assignment.description}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* review dialog */}
      <Dialog open={Boolean(activeSubmission)} onOpenChange={(open) => (!open ? setReviewSubmissionId(null) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
          </DialogHeader>
          {activeSubmission ? (() => {
            const status = getStatus(activeSubmission.submitted_at);
            const draft = drafts[activeSubmission.id];
            const currentScore = draft?.score ?? (activeSubmission.score !== undefined && activeSubmission.score !== null ? String(activeSubmission.score) : '');
            const currentFeedback = draft?.feedback ?? (activeSubmission.feedback ?? '');
            return (
              <div className="space-y-4 text-sm text-neutral-600">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${avatarColor(activeSubmission.student_name ?? 'S')}`}>
                      {initials(activeSubmission.student_name ?? 'Student')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{activeSubmission.student_name ?? 'Student'}</div>
                      <div className="text-xs text-neutral-400">{new Date(activeSubmission.submitted_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>{status.label}</span>
                </div>

                {activeSubmission.submission_text && (
                  <div className="rounded-xl border border-neutral-100 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Response</div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{activeSubmission.submission_text}</p>
                  </div>
                )}
                {activeSubmission.submission_url && (
                  <a href={activeSubmission.submission_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--brand-blue-deep)] hover:underline">
                    Open submitted link ↗
                  </a>
                )}
                {activeSubmission.submission_file && (
                  <a href={activeSubmission.submission_file} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--brand-blue-deep)] hover:underline">
                    View attachment ↗
                  </a>
                )}

                <div className="grid gap-3 md:grid-cols-[140px,1fr]">
                  <Input placeholder="Score" value={currentScore} onChange={(e) => setDraft(activeSubmission.id, { score: e.target.value })} />
                  <Input placeholder="Feedback" value={currentFeedback} onChange={(e) => setDraft(activeSubmission.id, { feedback: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" variant="outline" disabled={aiGrade.isPending} onClick={() => aiGrade.mutate(activeSubmission.id)}>
                    {aiGrade.isPending ? 'AI grading…' : '✨ AI grade'}
                  </Button>
                  <Button type="button" disabled={manualGrade.isPending} onClick={() => {
                    const parsedScore = currentScore.trim() === '' ? undefined : Number(currentScore);
                    if (parsedScore !== undefined && Number.isNaN(parsedScore)) return;
                    manualGrade.mutate({ submissionId: activeSubmission.id, score: parsedScore, feedback: currentFeedback || undefined });
                  }}>
                    {manualGrade.isPending ? 'Saving…' : 'Save grade'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => {
                    manualGrade.mutate({ submissionId: activeSubmission.id, score: null, feedback: '' });
                    setDraft(activeSubmission.id, { score: '', feedback: '' });
                  }}>
                    Clear grade
                  </Button>
                </div>
              </div>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
