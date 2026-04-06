'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { studentNav } from '@/components/navigation/nav-config';
import { ChatPanel } from '@/features/chat/components/ChatPanel';

export default function StudentChatPage() {
  return (
    <AppShell title="Student Dashboard" subtitle="Chat" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Real-time chat"
          description="Join section discussions and collaborate with your classmates."
        />
        <ChatPanel />
      </div>
    </AppShell>
  );
}
