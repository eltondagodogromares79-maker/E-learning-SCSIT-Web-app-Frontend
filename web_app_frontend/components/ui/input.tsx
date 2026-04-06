import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl px-3 py-2 text-sm placeholder:text-[rgba(15,23,42,0.4)] focus-visible:outline-none disabled:opacity-50',
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
        boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.03)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(47,111,246,0.5)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(47,111,246,0.18)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(15,23,42,0.03)';
        props.onBlur?.(e);
      }}
      {...props}
    />
  )
);
Input.displayName = 'Input';
