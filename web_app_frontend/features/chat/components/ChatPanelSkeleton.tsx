'use client';

function Pulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${className}`}
    />
  );
}

export function ChatRoomListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-3 py-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)]"
        >
          <Pulse className="h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-3 w-12" />
            </div>
            <Pulse className="h-3 w-40 max-w-full" />
            <Pulse className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatMessagesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => {
        const mine = index % 2 === 1;
        return (
          <div key={index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[72%] rounded-2xl border border-slate-200/90 px-4 py-3 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.3)] ${
                mine
                  ? 'bg-[linear-gradient(180deg,rgba(224,231,255,0.95),rgba(199,210,254,0.9))]'
                  : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]'
              }`}
            >
              <Pulse className="h-3 w-16" />
              <Pulse className="mt-2 h-4 w-48 max-w-full" />
              <Pulse className="mt-2 h-4 w-36 max-w-full" />
              <Pulse className="mt-3 h-3 w-14" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.4)] lg:w-[340px] lg:shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Pulse className="h-6 w-28" />
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <Pulse className="h-10 w-full rounded-full" />
        </div>
        <div className="mt-5">
          <Pulse className="mb-3 h-3 w-20" />
          <ChatRoomListSkeleton />
        </div>
      </div>

      <div className="flex-1 rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_18px_42px_-30px_rgba(15,23,42,0.4)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <Pulse className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Pulse className="h-5 w-32" />
              <Pulse className="h-3 w-20" />
            </div>
          </div>
          <Pulse className="h-8 w-8 rounded-full" />
        </div>
        <div className="space-y-4 bg-[var(--surface-2)] px-6 py-5">
          <ChatMessagesSkeleton />
        </div>
        <div className="border-t border-slate-200/80 px-4 py-4">
          <div className="flex gap-2">
            <Pulse className="h-10 flex-1 rounded-xl" />
            <Pulse className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
