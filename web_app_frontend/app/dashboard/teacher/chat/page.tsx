'use client';

import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { teacherNav } from '@/components/navigation/nav-config';
import { ChatPanelSkeleton } from '@/features/chat/components/ChatPanelSkeleton';

const ChatPanel = dynamic(
  () => import('@/features/chat/components/ChatPanel').then((mod) => mod.ChatPanel),
  { ssr: false, loading: () => <ChatPanelSkeleton /> }
);

export default function TeacherChatPage() {
  return (
    <AppShell title="Teacher Dashboard" subtitle="Chat" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader
          title="Real-time chat"
          description="Stay connected with your sections and study groups in real time."
        />
        <ChatPanel />
      </div>
    </AppShell>
  );
}
