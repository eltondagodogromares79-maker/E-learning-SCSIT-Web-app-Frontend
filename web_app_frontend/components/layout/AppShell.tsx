'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/navigation/nav-config';
import type { UserRole } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DashboardFooter } from '@/components/layout/DashboardFooter';

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
  const [hasMounted, setHasMounted] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isInitializing, hasHydrated } = useAuth();
  const isStudent = user?.role === 'student';

  React.useEffect(() => {
    setHasMounted(true);
  }, []);
  const filteredNavItems = React.useMemo(() => {
    if (!user) return navItems;
    if (user.role !== 'adviser') {
      return navItems.filter((item) => item.href !== '/dashboard/teacher/adviser');
    }
    return navItems;
  }, [navItems, user]);

  const loginHref = React.useMemo(() => {
    const nextPath = pathname && pathname.startsWith('/') ? pathname : '/dashboard';
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  React.useEffect(() => {
    if (!hasMounted) return;
    if (!hasHydrated) return;
    if (isInitializing) return;
    if (!user) {
      router.replace(loginHref);
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
  }, [hasHydrated, hasMounted, isInitializing, loginHref, pathname, requiredRole, router, user]);

  const handleLogout = React.useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  const shellBackground = 'var(--page-gradient)';

  const shellStyle: React.CSSProperties = {
    background: shellBackground,
    ...(isStudent
      ? {
          ['--page-header-bg' as const]: 'var(--surface)',
          ['--page-header-border' as const]: 'var(--border)',
          ['--page-header-shadow' as const]: 'var(--shadow-card)',
          ['--card-bg' as const]: 'var(--surface)',
        }
      : {}),
  };

  return (
    <div className="min-h-screen" style={shellStyle}>
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
            <div className="flex flex-col min-h-screen flex-1 min-w-0">
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
              <main className={cn('flex-1 px-6 pb-10 pt-6 sm:px-8')}>{children}</main>
              <DashboardFooter />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
