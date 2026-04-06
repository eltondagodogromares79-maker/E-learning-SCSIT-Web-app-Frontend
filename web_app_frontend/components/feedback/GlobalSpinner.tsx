'use client';

import { useEffect, useState } from 'react';
import { loadingBus } from '@/lib/loadingBus';

export function GlobalSpinner() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    return loadingBus.subscribe(setPending);
  }, []);

  if (pending <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-blue-deep)] border-t-transparent"
          aria-hidden="true"
        />
        <div className="text-xs font-semibold text-[var(--brand-blue-deep)]">Loading…</div>
      </div>
    </div>
  );
}
