'use client';

import { useEffect, useRef, useState } from 'react';

type ReliableSkeletonOptions = {
  delayMs?: number;
  minVisibleMs?: number;
};

export function useReliableSkeleton(
  loading: boolean,
  options: ReliableSkeletonOptions = {}
) {
  const { delayMs = 120, minVisibleMs = 280 } = options;
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (loading) {
      if (visible) return;
      timeoutRef.current = setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delayMs);
      return;
    }

    if (!visible) return;

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : minVisibleMs;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    timeoutRef.current = setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [delayMs, loading, minVisibleMs, visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return visible;
}
