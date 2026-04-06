import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatItem {
  label: string;
  value: string;
  trend?: string;
}

export function StatsGrid({ stats, className }: { stats: StatItem[]; className?: string }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {stats.map((stat, i) => (
        <Card key={stat.label} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(15,23,42,0.5)' }}>
              {stat.label}
            </div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
              {stat.value}
            </div>
            {stat.trend ? (
              <div className="mt-1 text-xs" style={{ color: 'var(--brand-blue-deep)' }}>{stat.trend}</div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
