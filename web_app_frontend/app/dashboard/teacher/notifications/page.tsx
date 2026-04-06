'use client';

import AppShell from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { teacherNav } from '@/components/navigation/nav-config';
import { NotificationsPage } from '@/features/notifications/components/NotificationsPage';

export default function TeacherNotificationsPage() {
  return (
    <AppShell title="Teacher Dashboard" subtitle="Notifications" navItems={teacherNav} requiredRole="teacher">
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Stay updated with your class activity." />
        <NotificationsPage />
      </div>
    </AppShell>
  );
}
