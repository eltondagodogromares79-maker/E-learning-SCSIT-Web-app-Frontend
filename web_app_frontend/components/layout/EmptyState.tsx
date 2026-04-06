import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <div className="text-lg font-semibold text-neutral-900">{title}</div>
        <p className="text-sm text-neutral-500">{description}</p>
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
