'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Eye, EyeOff, Loader2, BookOpen, Users, Award, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePublicStats } from '@/features/dashboard/hooks/usePublicStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const fallbackStats = [
  { icon: Users, value: '…', label: 'Learners' },
  { icon: BookOpen, value: '…', label: 'Subjects' },
  { icon: Award, value: '…', label: 'Teachers' },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, user, isInitializing, hasHydrated } = useAuth();
  const { data: publicStats } = usePublicStats();
  const stats = publicStats
    ? [
        { icon: Users, value: String(publicStats.students), label: 'Learners' },
        { icon: BookOpen, value: String(publicStats.subjects), label: 'Subjects' },
        { icon: Award, value: String(publicStats.teachers), label: 'Teachers' },
      ]
    : fallbackStats;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');
  const nextParam = searchParams.get('next');
  const resolveNextHref = (fallback: string) => {
    if (!nextParam) return fallback;
    if (!nextParam.startsWith('/')) return fallback;
    if (nextParam.startsWith('//')) return fallback;
    return nextParam;
  };

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      const user = await login(data.email, data.password);
      const role = user?.role ?? 'student';
      const roleRoutes: Record<string, string> = {
        student: '/dashboard/student',
        teacher: '/dashboard/teacher',
        instructor: '/dashboard/teacher',
        adviser: '/dashboard/teacher/adviser',
      };
      const fallbackHref = roleRoutes[role] ?? '/dashboard';
      const nextHref = resolveNextHref(fallbackHref);
      if (user?.must_change_password) {
        router.push(`/change-password?next=${encodeURIComponent(nextHref)}`);
        return;
      }
      router.push(nextHref);
    } catch (err: unknown) { void err; }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (isInitializing || !user) return;
    const roleRoutes: Record<string, string> = {
      student: '/dashboard/student',
      teacher: '/dashboard/teacher',
      instructor: '/dashboard/teacher',
      adviser: '/dashboard/teacher/adviser',
    };
    const fallbackHref = roleRoutes[user.role] ?? '/dashboard';
    const nextHref = resolveNextHref(fallbackHref);
    if (user.must_change_password) {
      router.replace(`/change-password?next=${encodeURIComponent(nextHref)}`);
      return;
    }
    router.replace(nextHref);
  }, [hasHydrated, isInitializing, nextParam, router, user]);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden p-12"
        style={{
          background: 'var(--brand-blue)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute bottom-20 -left-16 h-56 w-56 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute top-1/2 right-8 h-32 w-32 rounded-full opacity-5" style={{ background: 'white' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Image src="/logo.png" alt="SCSIT NEXUS logo" width={36} height={36} className="h-9 w-9" priority />
          </div>
          <span className="text-xl font-semibold text-white">SCSIT NEXUS</span>
        </div>

        {/* Main copy */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
              E-Learning Platform
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white">
              A focused learning hub<br />for modern schools.
            </h1>
            <p className="text-sm leading-relaxed text-white/70">
              Bring classes, assessments, and progress into a single workspace — built for students, teachers, and administrators.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <Icon className="mb-2 h-5 w-5 text-white/70" />
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="mt-0.5 text-xs text-white/60">{label}</div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Role-based dashboards', 'AI-assisted grading', 'Live proctoring', 'Real-time analytics'].map((f) => (
              <span key={f} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 backdrop-blur-sm">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">Secure access for every role with tailored dashboards.</p>
      </motion.div>

      {/* Right panel — form */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-1 flex-col px-6 py-8"
      >
        {/* Back button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'rgba(11,26,53,0.55)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        {/* Centered form area */}
        <div className="flex flex-1 flex-col items-center justify-center">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--brand-blue)' }}>
            <Image src="/logo.png" alt="SCSIT NEXUS logo" width={28} height={28} className="h-7 w-7" priority />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>SCSIT NEXUS</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'rgba(11,26,53,0.5)' }}>Sign in to your account to continue.</p>
          </div>

          <div
            className="rounded-2xl p-7 shadow-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}
                >
                  {error}
                </motion.div>
              )} */}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(11,26,53,0.35)' }} />
                  <Input id="email" type="email" placeholder="you@school.edu" {...register('email')} className="pl-10" />
                </div>
                {errors.email && <p className="text-xs" style={{ color: '#dc2626' }}>{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(11,26,53,0.35)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs" style={{ color: '#dc2626' }}>{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2" style={{ color: 'rgba(11,26,53,0.6)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setValue('rememberMe', e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: 'var(--brand-blue)' }}
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-sm transition-colors hover:text-[var(--brand-blue)]" style={{ color: 'rgba(11,26,53,0.5)' }}>
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs" style={{ color: 'rgba(11,26,53,0.4)' }}>
            Need help?{' '}
            <Link href="/contact" className="transition-colors hover:text-[var(--brand-blue)]" style={{ color: 'rgba(11,26,53,0.55)' }}>
              Contact your administrator
            </Link>
          </p>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
