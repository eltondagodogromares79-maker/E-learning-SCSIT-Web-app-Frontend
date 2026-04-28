'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isInitializing, hasHydrated } = useAuth();
  const loginHref = '/login?next=%2Fdashboard';

  useEffect(() => {
    if (!hasHydrated) return;
    if (isInitializing) return;
    if (!user) {
      router.replace(loginHref);
      return;
    }
    if (user.must_change_password) {
      router.replace('/change-password');
      return;
    }
    if (user.role === 'student') {
      router.replace('/dashboard/student');
      return;
    }
    if (user.role === 'adviser') {
      router.replace('/dashboard/teacher/adviser');
      return;
    }
    router.replace('/dashboard/teacher');
  }, [hasHydrated, isInitializing, loginHref, router, user]);

  return null;
}
