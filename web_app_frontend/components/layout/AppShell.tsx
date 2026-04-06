'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/navigation/nav-config';
import type { UserRole } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlobalSpinner } from '@/components/feedback/GlobalSpinner';

interface AppShellProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  children: React.ReactNode;
  requiredRole?: UserRole;
  minimal?: boolean;
}

export default function AppShell({ title, subtitle, navItems, children, requiredRole, minimal }: AppShellProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isInitializing } = useAuth();
  const filteredNavItems = React.useMemo(() => {
    if (!user) return navItems;
    if (user.role !== 'adviser') {
      return navItems.filter((item) => item.href !== '/dashboard/teacher/adviser');
    }
    return navItems;
  }, [navItems, user]);

  React.useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.must_change_password) {
      if (pathname !== '/change-password') {
        router.replace('/change-password');
      }
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      const isTeacherRole = user.role === 'teacher' || user.role === 'instructor' || user.role === 'adviser';
      const requiresTeacher = requiredRole === 'teacher';
      if (requiresTeacher && isTeacherRole) {
        return;
      }
      const roleRoutes: Record<UserRole, string> = {
        student: '/dashboard/student',
        teacher: '/dashboard/teacher',
        instructor: '/dashboard/teacher',
        adviser: '/dashboard/teacher',
        principal: '/dashboard/principal',
        dean: '/dashboard/dean',
        admin: '/dashboard/admin',
      };
      router.replace(roleRoutes[user.role]);
    }
  }, [isInitializing, pathname, requiredRole, router, user]);

  const handleLogout = React.useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <GlobalSpinner />
      {minimal ? (
        <main className={cn('px-4 pb-8 pt-6 sm:px-8')}>{children}</main>
      ) : (
        <>
          {isOpen ? (
            <button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          ) : null}
          <div className="flex">
            <Sidebar isOpen={isOpen} navItems={filteredNavItems} onToggle={() => setIsOpen((prev) => !prev)} />
            <div className="flex-1 min-w-0">
              <TopNav
                title={title}
                subtitle={subtitle}
                onMenuClick={() => setIsOpen((prev) => !prev)}
                onLogout={handleLogout}
                userName={user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : ''}
                userAvatarUrl={user?.profile_picture ?? ''}
                userRole={user?.role}
                chatHref={
                  user?.role === 'student'
                    ? '/dashboard/student/chat'
                    : user?.role === 'teacher' || user?.role === 'instructor' || user?.role === 'adviser'
                    ? '/dashboard/teacher/chat'
                    : undefined
                }
              />
              <main className={cn('px-6 pb-10 pt-6 sm:px-8')}>{children}</main>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
