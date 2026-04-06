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
        background: 'linear-gradient(135deg, rgba(47,111,246,0.08) 0%, rgba(255,255,255,0.96) 60%)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        {description ? <p className="text-sm" style={{ color: 'rgba(15,23,42,0.6)' }}>{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
