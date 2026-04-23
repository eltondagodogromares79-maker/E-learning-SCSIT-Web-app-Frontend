'use client';

import { useEffect } from 'react';

export function CryptoUUIDPolyfill() {
  useEffect(() => {
    if (typeof crypto === 'undefined') return;
    if (typeof crypto.randomUUID === 'function') return;
    crypto.randomUUID = (() =>
      `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-4${Math.random().toString(16).slice(2, 5)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 14)}`) as typeof crypto.randomUUID;
  }, []);

  return null;
}
