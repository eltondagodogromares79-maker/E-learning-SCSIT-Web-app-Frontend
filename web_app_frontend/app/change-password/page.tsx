'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ChangePassword from '@/features/auth/components/ChangePassword';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const roleRoutes: Record<string, string> = {
  student: '/dashboard/student',
  teacher: '/dashboard/teacher',
  principal: '/dashboard/principal',
  dean: '/dashboard/dean',
  admin: '/dashboard/admin',
};

export default function ChangePasswordGatePage() {
  const router = useRouter();
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.must_change_password) {
      router.replace(roleRoutes[user.role] ?? '/dashboard');
    }
  }, [isInitializing, router, user]);

  return (
    <div className="min-h-screen bg-[#F5F9FF] px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold text-neutral-900">Update your password</h1>
            <p className="text-sm text-neutral-500">
              For security, please replace the temporary password provided by the admin before continuing.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Set a new password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePassword />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
