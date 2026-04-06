import * as React from 'react';
import { cn } from '@/lib/utils';

export const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('h-px w-full bg-[rgba(17,17,17,0.06)]', className)} {...props} />
  )
);
Separator.displayName = 'Separator';
