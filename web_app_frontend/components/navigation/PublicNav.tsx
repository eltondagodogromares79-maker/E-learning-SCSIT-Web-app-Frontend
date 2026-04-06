'use client';

import Link from 'next/link';
import { School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function PublicNav() {
  const { user, isInitializing } = useAuth();
  const roleRoutes: Record<string, string> = {
    student: '/dashboard/student',
    teacher: '/dashboard/teacher',
    principal: '/dashboard/principal',
    admin: '/dashboard/admin',
  };
  const dashboardHref = user ? (roleRoutes[user.role] ?? '/dashboard') : '/dashboard';

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(37,99,235,0.05)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--brand-blue)', boxShadow: '0 6px 16px rgba(37,99,235,0.2)' }}
          >
            <School className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>SCSIT NEXUS</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex" style={{ color: 'rgba(15,23,42,0.6)' }}>
          <Link href="/home" className="transition-colors hover:text-[var(--brand-blue-deep)]">Home</Link>
          <Link href="/about" className="transition-colors hover:text-[var(--brand-blue-deep)]">About</Link>
          <Link href="/contact" className="transition-colors hover:text-[var(--brand-blue-deep)]">Directory</Link>
        </nav>
        <div className="flex items-center gap-2">
          {!isInitializing && user ? (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-2 text-[10px] sm:text-xs"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'rgba(15,23,42,0.6)' }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--brand-blue)' }} />
              <span className="hidden sm:inline">{user.first_name} {user.last_name} · {user.role}</span>
              <span className="sm:hidden">{user.role}</span>
            </div>
          ) : null}
          {!isInitializing && !user ? (
            <Button variant="ghost" as={Link} href="/login">Sign in</Button>
          ) : null}
          <Button as={Link} href={dashboardHref}>
            {user ? 'Go to dashboard' : 'Explore dashboard'}
          </Button>
        </div>
      </div>
    </header>
  );
}
