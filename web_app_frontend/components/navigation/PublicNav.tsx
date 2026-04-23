'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);

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
        background: 'linear-gradient(135deg, #0d1282 0%, #1e3a8a 60%, #1e4fd6 100%)',
        boxShadow: '0 4px 24px rgba(13,18,130,0.25)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm" style={{ border: '1px solid rgba(255,255,255,0.25)' }}>
            <Image src="/logo.png" alt="SCSIT NEXUS logo" width={32} height={32} className="h-8 w-8" priority />
          </div>
          <span className="text-base font-bold text-white">SCSIT NEXUS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="relative rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!isInitializing && user ? (
            <div
              className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white sm:flex"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{user.first_name} {user.last_name} · {user.role}</span>
            </div>
          ) : null}
          {!isInitializing && !user ? (
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white sm:block"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href={dashboardHref}
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1282] transition-all hover:opacity-90 sm:block"
            style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            {user ? 'Dashboard' : 'Explore'}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="flex h-4 w-5 flex-col items-center justify-between">
              <span className="block h-0.5 w-full rounded-full bg-white" />
              <span className="block h-0.5 w-full rounded-full bg-white" />
              <span className="block h-0.5 w-full rounded-full bg-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen ? (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(13,18,130,0.95)', backdropFilter: 'blur(16px)' }}>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ label, href }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    style={{
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    }}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            {!isInitializing && user ? (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{user.first_name} {user.last_name} · {user.role}</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 pt-1">
              {!isInitializing && !user ? (
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
              ) : null}
              <Link
                href={dashboardHref}
                className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-[#0d1282]"
                style={{ background: 'white' }}
                onClick={() => setIsOpen(false)}
              >
                {user ? 'Dashboard' : 'Explore'}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
