'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace('/login');
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
  }, [isInitializing, router, user]);

  return null;
}

