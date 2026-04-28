'use client';

import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { studentNav } from '@/components/navigation/nav-config';
import { ChatPanelSkeleton } from '@/features/chat/components/ChatPanelSkeleton';

const ChatPanel = dynamic(
  () => import('@/features/chat/components/ChatPanel').then((mod) => mod.ChatPanel),
  { ssr: false, loading: () => <ChatPanelSkeleton /> }
);

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
