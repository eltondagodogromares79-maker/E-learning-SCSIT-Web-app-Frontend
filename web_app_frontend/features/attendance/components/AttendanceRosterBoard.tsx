'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const statusOrder: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];

const statusMeta: Record<AttendanceStatus, { label: string; cardClass: string; badgeClass: string; emptyText: string }> = {
  present: {
    label: 'Present',
    cardClass: 'border-emerald-200 bg-emerald-50/60',
    badgeClass: 'bg-emerald-600 text-white',
    emptyText: 'No students marked present.',
  },
  late: {
    label: 'Late',
    cardClass: 'border-amber-200 bg-amber-50/70',
    badgeClass: 'bg-amber-500 text-white',
    emptyText: 'No students marked late.',
  },
  excused: {
    label: 'Excused',
    cardClass: 'border-slate-200 bg-slate-50/80',
    badgeClass: 'bg-slate-600 text-white',
    emptyText: 'No students marked excused.',
  },
  absent: {
    label: 'Absent',
    cardClass: 'border-rose-200 bg-rose-50/70',
    badgeClass: 'bg-rose-600 text-white',
    emptyText: 'No students marked absent.',
  },
};

type AttendanceRosterBoardProps = {
  records: AttendanceRecord[];
  emptyMessage?: string;
};

export function AttendanceRosterBoard({
  records,
  emptyMessage = 'No attendance records available for this session yet.',
}: AttendanceRosterBoardProps) {
  const groupedRecords = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = records.filter((record) => record.status === status);
      return acc;
    }, {} as Record<AttendanceStatus, AttendanceRecord[]>);
  }, [records]);

  if (!records.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.16)] bg-[var(--surface-2)] p-6 text-sm text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {statusOrder.map((status) => {
        const meta = statusMeta[status];
        const students = groupedRecords[status];

        return (
          <div
            key={status}
            className={cn('rounded-2xl border p-4 shadow-sm', meta.cardClass)}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {meta.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-neutral-900">{students.length}</div>
              </div>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', meta.badgeClass)}>
                <Users className="h-3.5 w-3.5" />
                {students.length} student{students.length === 1 ? '' : 's'}
              </span>
            </div>

            {students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[rgba(15,23,42,0.12)] bg-white/70 p-3 text-xs text-neutral-500">
                {meta.emptyText}
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {students.map((record) => (
                  <div key={record.id} className="rounded-xl border border-white/80 bg-white/90 px-3 py-2.5">
                    <div className="text-sm font-semibold text-neutral-900">
                      {record.student_name ?? 'Student'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {record.student_number ?? record.student}
                    </div>
                    {record.note ? (
                      <div className="mt-1 text-xs text-neutral-500">{record.note}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
