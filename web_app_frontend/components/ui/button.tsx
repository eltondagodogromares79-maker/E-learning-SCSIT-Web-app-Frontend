import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(47,111,246,0.25)] disabled:opacity-50 disabled:pointer-events-none';

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-[var(--brand-blue)] text-white shadow-[0_12px_30px_-20px_rgba(30,79,214,0.7)] hover:bg-[var(--brand-blue-deep)]',
  outline: '',
  ghost: '',
  secondary: '',
  destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  link: 'underline-offset-4 hover:underline',
};

const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
  default: {},
  outline: { border: '1px solid var(--border)', color: 'var(--brand-blue-deep)', background: 'rgba(255,255,255,0.7)' },
  ghost: { color: 'var(--brand-blue-deep)', background: 'transparent' },
  secondary: { background: 'var(--surface-2)', color: 'var(--foreground)', border: '1px solid var(--border)' },
  destructive: {},
  link: { color: 'var(--brand-blue-deep)' },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-6 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  as?: React.ElementType;
  href?: string;
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', as: Comp = 'button', style, ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  )
);

Button.displayName = 'Button';
