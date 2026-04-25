'use client';

import { useEffect, useRef, useState } from 'react';
import { loadingBus } from '@/lib/loadingBus';

export function GlobalSpinner() {
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return loadingBus.subscribe((pending) => {
      if (pending > 0) {
        // Only show after 200ms — fast requests never trigger it
        timerRef.current = setTimeout(() => {
          setVisible(true);
          setWidth(20);
          // Slowly creep to 85% while loading
          progressRef.current = setInterval(() => {
            setWidth((prev) => {
              if (prev >= 85) return prev;
              return prev + Math.random() * 8;
            });
          }, 400);
        }, 200);
      } else {
        // Clear the delay timer if request finished before 200ms
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (progressRef.current) {
          clearInterval(progressRef.current);
          progressRef.current = null;
        }
        if (visible) {
          // Shoot to 100% then fade out
          setWidth(100);
          rafRef.current = setTimeout(() => {
            setVisible(false);
            setWidth(0);
          }, 300);
        }
      }
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
      style={{ background: 'rgba(13,18,130,0.08)' }}
    >
      <div
        className="h-full transition-all ease-out"
        style={{
          width: `${Math.min(100, width)}%`,
          background: 'linear-gradient(90deg, #0D1282, #4f5fd4)',
          transitionDuration: width === 100 ? '200ms' : '400ms',
          boxShadow: '0 0 8px rgba(13,18,130,0.5)',
        }}
      />
    </div>
  );
}
