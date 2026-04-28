'use client';

type DashboardLoadingShellProps = {
  role: 'student' | 'teacher';
};

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${className}`}
    />
  );
}

export function DashboardLoadingShell({ role }: DashboardLoadingShellProps) {
  const accentClass =
    role === 'student'
      ? 'bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(125,211,252,0.12))]'
      : 'bg-[linear-gradient(135deg,rgba(13,18,130,0.16),rgba(16,185,129,0.1))]';

  return (
    <div className="min-h-screen bg-[var(--page-gradient)] px-6 pb-10 pt-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBox className="h-4 w-24 rounded-full" />
          <SkeletonBox className="h-8 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-32 rounded-xl" />
          <SkeletonBox className="h-11 w-11 rounded-full" />
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-3xl border border-white/35 p-8 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] ${accentClass}`}>
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20" />
        <div className="relative grid gap-6 lg:grid-cols-[1.5fr,1fr] lg:items-end">
          <div className="space-y-4">
            <SkeletonBox className="h-4 w-28 rounded-full bg-white/35" />
            <SkeletonBox className="h-10 w-72 max-w-full bg-white/50" />
            <SkeletonBox className="h-4 w-[26rem] max-w-full bg-white/35" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/25 bg-white/18 p-4 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
              >
                <SkeletonBox className="h-4 w-14 bg-white/35" />
                <SkeletonBox className="mt-3 h-8 w-16 bg-white/55" />
                <SkeletonBox className="mt-2 h-3 w-20 bg-white/35" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          {[0, 1, 2].map((section) => (
            <div
              key={section}
              className="rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.4)]"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <SkeletonBox className="h-6 w-40" />
                <SkeletonBox className="h-9 w-28 rounded-xl" />
              </div>
              <div className="space-y-4">
                {[0, 1, 2].map((card) => (
                  <div
                    key={card}
                    className="rounded-2xl border border-slate-200/85 bg-slate-50/90 p-4 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.28)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-5 w-52 max-w-full" />
                      </div>
                      <SkeletonBox className="h-8 w-20 rounded-full" />
                    </div>
                    <SkeletonBox className="h-3 w-full" />
                    <SkeletonBox className="mt-2 h-3 w-4/5" />
                    <div className="mt-4 flex items-center justify-between">
                      <SkeletonBox className="h-3 w-28" />
                      <SkeletonBox className="h-9 w-24 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {[0, 1].map((panel) => (
            <div
              key={panel}
              className="rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.4)]"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <SkeletonBox className="h-6 w-36" />
                <SkeletonBox className="h-8 w-16 rounded-full" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/85 p-3 shadow-[0_10px_22px_-22px_rgba(15,23,42,0.25)]"
                  >
                    <SkeletonBox className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-4 w-32" />
                      <SkeletonBox className="h-3 w-24" />
                    </div>
                    <SkeletonBox className="h-8 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
