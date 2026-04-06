import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'outline' | 'muted' | 'success' | 'destructive';

const variantStyles: Record<BadgeVariant, string> = {
  default: '',
  outline: '',
  muted: '',
  success: '',
  destructive: '',
};

const variantInlineStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'rgba(47,111,246,0.12)', color: 'var(--brand-blue-deep)', border: '1px solid rgba(47,111,246,0.25)' },
  outline: { border: '1px solid var(--border)', color: 'rgba(15,23,42,0.65)', background: 'rgba(255,255,255,0.7)' },
  muted: { background: 'var(--surface-2)', color: 'rgba(15,23,42,0.7)', border: '1px solid var(--border)' },
  success: { background: 'rgba(34,197,94,0.14)', color: '#15803d', border: '1px solid rgba(34,197,94,0.3)' },
  destructive: { background: 'rgba(239,68,68,0.12)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.28)' },
};

export const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
}>(
  ({ className, variant = 'muted', style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', variantStyles[variant], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';
