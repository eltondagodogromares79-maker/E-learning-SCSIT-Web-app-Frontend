'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookCopy,
  BookOpen,
  ChartBar,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  LayoutGrid,
  School,
  Settings,
  Users,
  Video,
} from 'lucide-react';
import type { NavIconName, NavItem } from '@/components/navigation/nav-config';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  navItems: NavItem[];
}

export function Sidebar({ isOpen, onToggle, navItems }: SidebarProps) {
  const pathname = usePathname();
  const iconMap: Record<NavIconName, React.ComponentType<{ className?: string }>> = {
    LayoutGrid,
    BookOpen,
    BookCopy,
    ClipboardList,
    ClipboardCheck,
    ChartBar,
    GraduationCap,
    Users,
    Settings,
    Layers,
    FileText,
    School,
    Video,
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col p-6 transition-all duration-300 lg:sticky lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isOpen ? 'lg:w-72' : 'lg:w-20'
      )}
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border)',
        boxShadow: '6px 0 24px -16px rgba(15,23,42,0.4)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--brand-blue)', boxShadow: '0 10px 28px -16px rgba(30,79,214,0.8)' }}
          >
            <School className="h-5 w-5 text-white" />
          </div>
          {isOpen ? <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>SCSIT NEXUS</span> : null}
        </div>
        <button
          onClick={onToggle}
          className="rounded-md p-1 transition-colors"
          style={{ border: '1px solid var(--border)', color: 'rgba(11,26,53,0.6)' }}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);
          return (
          <Link
            key={item.label}
            href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
            isActive
              ? 'text-[var(--brand-blue-deep)]'
              : 'text-[rgba(15,23,42,0.6)] hover:text-[var(--brand-blue-deep)]'
          )}
          style={isActive ? {
            background: 'rgba(47,111,246,0.12)',
            borderLeft: '2px solid var(--brand-blue)',
            paddingLeft: '10px',
          } : {}}
        >
              <Icon className="h-4 w-4 shrink-0" />
              {isOpen ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {isOpen && (
        <div className="mt-auto pt-6">
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div className="text-xs font-semibold" style={{ color: 'var(--brand-blue-deep)' }}>SCSIT NEXUS</div>
            <div className="mt-1 text-xs" style={{ color: 'rgba(15,23,42,0.5)' }}>Academic Year 2024–25</div>
          </div>
        </div>
      )}
    </aside>
  );
}
