'use client';

function Pulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${className}`}
    />
  );
}

export function StudentCardGridSkeleton({
  count = 6,
  columnsClass = 'md:grid-cols-2 xl:grid-cols-3',
}: {
  count?: number;
  columnsClass?: string;
}) {
  return (
    <div className={`grid gap-5 ${columnsClass}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_14px_34px_-24px_rgba(15,23,42,0.4)]"
        >
          <div className="h-1.5 w-full rounded-none bg-gradient-to-r from-[var(--brand-blue)]/30 via-sky-300/50 to-violet-300/35" />
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Pulse className="h-3 w-24 rounded-full" />
                <Pulse className="h-5 w-44 max-w-full" />
              </div>
              <Pulse className="h-6 w-20 rounded-full" />
            </div>
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-4/5" />
            <div className="flex items-center justify-between gap-3">
              <Pulse className="h-8 w-28 rounded-xl" />
              <Pulse className="h-8 w-20 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-center gap-3">
            <Pulse className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-24" />
            </div>
            <Pulse className="h-7 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentTableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_14px_32px_-26px_rgba(15,23,42,0.35)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="pb-3 text-left">
                <Pulse className="h-3 w-20 rounded-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, colIndex) => (
                <td key={colIndex} className="py-3 pr-4">
                  <Pulse className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StudentTranscriptSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-28" />
            </div>
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Pulse className="h-16 w-full rounded-xl" />
            <Pulse className="h-16 w-full rounded-xl" />
            <Pulse className="h-16 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
