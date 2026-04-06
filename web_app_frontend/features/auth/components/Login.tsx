'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: 'Student', email: 'student@school.edu', password: 'student123' },
  { role: 'Teacher', email: 'teacher@school.edu', password: 'teacher123' },
  { role: 'Principal', email: 'principal@school.edu', password: 'principal123' },
  { role: 'Dean', email: 'dean@school.edu', password: 'dean123' },
  { role: 'Admin', email: 'admin@school.edu', password: 'admin123' },
];

const svgData = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const heroImages = [
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#dbeafe"/>
          <stop offset="1" stop-color="#eff6ff"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="20" fill="url(#bg)"/>
      <rect x="30" y="60" width="260" height="90" rx="16" fill="#ffffff" opacity="0.9"/>
      <rect x="48" y="78" width="80" height="56" rx="10" fill="#bfdbfe"/>
      <rect x="140" y="78" width="132" height="14" rx="7" fill="#93c5fd"/>
      <rect x="140" y="100" width="110" height="12" rx="6" fill="#c7d2fe"/>
      <rect x="140" y="120" width="90" height="10" rx="5" fill="#e0e7ff"/>
      <circle cx="70" cy="100" r="16" fill="#60a5fa"/>
    </svg>`
  ),
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="bg2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#e0f2fe"/>
          <stop offset="1" stop-color="#f0f9ff"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="20" fill="url(#bg2)"/>
      <rect x="28" y="30" width="120" height="140" rx="18" fill="#ffffff" opacity="0.95"/>
      <rect x="168" y="46" width="124" height="20" rx="10" fill="#bae6fd"/>
      <rect x="168" y="80" width="90" height="14" rx="7" fill="#93c5fd"/>
      <rect x="168" y="108" width="110" height="12" rx="6" fill="#bfdbfe"/>
      <circle cx="88" cy="80" r="28" fill="#7dd3fc"/>
      <rect x="58" y="118" width="60" height="10" rx="5" fill="#e0e7ff"/>
    </svg>`
  ),
  svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef2ff"/>
          <stop offset="1" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="20" fill="url(#bg3)"/>
      <rect x="24" y="42" width="272" height="116" rx="18" fill="#ffffff" opacity="0.96"/>
      <rect x="48" y="68" width="88" height="68" rx="12" fill="#c4b5fd"/>
      <rect x="150" y="70" width="120" height="12" rx="6" fill="#a5b4fc"/>
      <rect x="150" y="92" width="90" height="10" rx="5" fill="#c7d2fe"/>
      <rect x="150" y="112" width="70" height="10" rx="5" fill="#e0e7ff"/>
      <circle cx="92" cy="102" r="16" fill="#818cf8"/>
    </svg>`
  ),
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, user, isInitializing } = useAuth();
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

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      const user = await login(data.email, data.password);
      const role = user?.role ?? 'student';
      if (user?.must_change_password) {
        router.push('/change-password');
        return;
      }
      const roleRoutes: Record<string, string> = {
        student: '/dashboard/student',
        teacher: '/dashboard/teacher',
        instructor: '/dashboard/teacher',
        adviser: '/dashboard/teacher/adviser',
      };
      router.push(roleRoutes[role] ?? '/dashboard');
    } catch (err: unknown) {
      void err;
    }
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!user) return;
    if (user.must_change_password) {
      router.replace('/change-password');
      return;
    }
    const roleRoutes: Record<string, string> = {
      student: '/dashboard/student',
      teacher: '/dashboard/teacher',
      instructor: '/dashboard/teacher',
      adviser: '/dashboard/teacher/adviser',
    };
    router.replace(roleRoutes[user.role] ?? '/dashboard');
  }, [isInitializing, router, user]);

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm"
        >
          <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)]">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-semibold text-neutral-900">SCSIT NEXUS</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-neutral-900">
              A focused learning hub
              <br />
              for modern schools.
            </h1>
            <p className="text-sm text-neutral-500">
              Bring classes, assessments, and progress into a single workspace. Built for students, teachers, and
              administrators.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
              <div className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] px-3 py-1">1,200+ learners</div>
              <div className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] px-3 py-1">68 teachers</div>
              <div className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] px-3 py-1">24 subjects</div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {heroImages.map((src, index) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 shadow-sm"
                >
                  <img
                    src={src}
                    alt={`Campus snapshot ${index + 1}`}
                    className="h-24 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-neutral-400">Secure access for every role with tailored dashboards.</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center"
        >
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-neutral-900">Welcome back</h2>
              <p className="text-sm text-neutral-500">Sign in with your email to continue.</p>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600"
                    >
                      {error}
                    </motion.div>
                  )} */}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@school.edu"
                        {...register('email')}
                        className="pl-10"
                      />
                    </div>
                    {errors.email ? <p className="text-xs text-neutral-500">{errors.email.message}</p> : null}
                  </div>

                  <div className="space-y-2">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password ? <p className="text-xs text-neutral-500">{errors.password.message}</p> : null}
                  </div>

                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <label className="flex items-center gap-2">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setValue('rememberMe', event.target.checked)}
                        className="h-4 w-4 accent-neutral-900"
                      />
                      Remember me
                    </label>
                    <Link href="/forgot-password" className="text-neutral-500 hover:text-neutral-800">
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* <Card className="bg-white">
              <CardHeader>
                <CardTitle>Demo Accounts</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-xs text-neutral-500">Select a role to auto-fill demo credentials.</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => {
                        setValue('email', account.email);
                        setValue('password', account.password);
                      }}
                      className="rounded-lg border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] p-2 text-left text-xs text-neutral-600 hover:bg-[rgba(17,17,17,0.06)]"
                    >
                      <div className="font-medium text-neutral-800">{account.role}</div>
                      <div className="truncate">{account.email}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
