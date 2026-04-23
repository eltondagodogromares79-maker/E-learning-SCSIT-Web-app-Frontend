import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[var(--radius-card)] p-6 md:flex-row md:items-center md:justify-between',
        className
      )}
      style={{
        background: 'var(--page-header-bg, var(--surface))',
        border: '1px solid var(--page-header-border, var(--border))',
        boxShadow: 'var(--page-header-shadow, var(--shadow-card))',
      }}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        {description ? <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
