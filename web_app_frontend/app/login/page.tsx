import { Suspense } from 'react';
import Login from '@/features/auth/components/Login';

export default function LoginPage() {
  return (
    <Suspense fallback={<Login />}>
      <Login />
    </Suspense>
  );
}
