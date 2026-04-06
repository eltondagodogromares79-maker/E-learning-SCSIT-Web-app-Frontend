'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { studentNav } from '@/components/navigation/nav-config';
import { NotificationsPage } from '@/features/notifications/components/NotificationsPage';

export default function StudentNotificationsPage() {
  return (
    <AppShell title="Student Dashboard" subtitle="Notifications" navItems={studentNav} requiredRole="student">
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Stay updated with lessons, quizzes, and assignments." />
        <NotificationsPage />
      </div>
    </AppShell>
  );
}
