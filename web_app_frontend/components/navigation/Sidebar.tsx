'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
  Sparkles,
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
        'fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col transition-all duration-300 lg:sticky lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isOpen ? 'lg:w-72' : 'lg:w-20'
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(13,18,130,0.03) 0%, rgba(13,18,130,0.01) 100%)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-br-3xl p-6" style={{ background: 'linear-gradient(135deg, var(--brand-blue) 0%, #1e4fd6 100%)', boxShadow: '0 8px 24px rgba(13,18,130,0.15)' }}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm">
              <Image src="/logo.png" alt="SCSIT" width={24} height={24} className="h-6 w-6" priority />
            </div>
            {isOpen ? <span className="text-lg font-bold text-white">SCSIT NEXUS</span> : null}
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !isOpen && 'rotate-180')} />
          </button>
        </div>
        {isOpen && (
          <div className="relative mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-xs font-medium text-white/90">Academic Year 2024–25</span>
          </div>
        )}
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'text-white shadow-md'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--brand-blue)]'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, var(--brand-blue) 0%, #1e4fd6 100%)',
              } : {}}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                isActive ? 'bg-white/20' : 'bg-[var(--surface-2)] group-hover:bg-[var(--brand-blue-muted)]'
              )}>
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-[var(--brand-blue)] group-hover:text-[var(--brand-blue)]')} />
              </div>
              {isOpen ? <span className="flex-1">{item.label}</span> : null}
              {isActive && isOpen && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {isOpen && (
        <div className="p-4">
          <div
            className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, rgba(13,18,130,0.08) 0%, rgba(13,18,130,0.03) 100%)', border: '1px solid var(--border)' }}
          >
            <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-30" style={{ background: 'var(--brand-blue)' }} />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--brand-blue)', boxShadow: '0 4px 12px rgba(13,18,130,0.2)' }}>
                <School className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold" style={{ color: 'var(--brand-blue-deep)' }}>Need Help?</div>
                <div className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>Contact your administrator for support.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
