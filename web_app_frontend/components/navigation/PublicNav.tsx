'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navLinks = [
  { label: 'Home', href: '/home' },
  { label: 'About', href: '/about' },
  { label: 'Directory', href: '/contact' },
];

export function PublicNav() {
  const { user, isInitializing } = useAuth();
  const pathname = usePathname();

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
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 12px rgba(47,111,246,0.06)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #2f6ff6, #1a3a8f)', boxShadow: '0 4px 12px rgba(47,111,246,0.3)' }}
          >
            <GraduationCap className="h-4.5 w-4.5 text-white" style={{ height: '1.1rem', width: '1.1rem' }} />
          </div>
          <span className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>SCSIT NEXUS</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? 'var(--brand-blue)' : 'rgba(15,23,42,0.6)',
                  background: isActive ? 'var(--brand-blue-muted)' : 'transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!isInitializing && user ? (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'rgba(15,23,42,0.6)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-blue)' }} />
              <span className="hidden sm:inline">{user.first_name} {user.last_name} · {user.role}</span>
              <span className="sm:hidden">{user.role}</span>
            </div>
          ) : null}
          {!isInitializing && !user ? (
            <Button variant="ghost" as={Link} href="/login" className="text-sm">Sign in</Button>
          ) : null}
          <Button as={Link} href={dashboardHref} size="sm">
            {user ? 'Dashboard' : 'Explore'}
          </Button>
        </div>
      </div>
    </header>
  );
}
