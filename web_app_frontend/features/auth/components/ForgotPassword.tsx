'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

type Step = 'request' | 'verify' | 'reset' | 'done';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const requestCode = async () => {
    setLoading(true);
    const friendlyFail =
      'We could not send a code to that email. Please contact your administration to reset your password.';
    try {
      await api.post('/api/users/password-reset/request/', { email });
      showToast({
        title: 'Code sent',
        description: 'We sent a 6-digit code to your email. Enter it to continue.',
        variant: 'success',
      });
      setStep('verify');
    } catch (err: any) {
      showToast({
        title: 'Unable to send code',
        description: err?.response?.data?.detail || friendlyFail,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    const friendlyFail = 'That code is invalid or has expired. Please request a new one.';
    try {
      await api.post('/api/users/password-reset/verify/', { email, code });
      setStep('reset');
    } catch (err: any) {
      showToast({
        title: 'Code not accepted',
        description: err?.response?.data?.detail || friendlyFail,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    if (newPassword !== confirmPassword) {
      showToast({ title: 'Passwords do not match', description: 'Please retype your new password.', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/users/password-reset/confirm/', {
        email,
        code,
        new_password: newPassword,
      });
      setStep('done');
      showToast({ title: 'Password updated', description: 'You can now sign in.', variant: 'success' });
    } catch (err: any) {
      showToast({
        title: 'Unable to reset password',
        description: err?.response?.data?.detail || 'Please try again or request a new code.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-blue)]">
              <Image src="/logo.png" alt="SCSIT NEXUS logo" width={32} height={32} className="h-8 w-8" priority />
            </div>
            <span className="text-2xl font-semibold text-neutral-900">SCSIT NEXUS</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-neutral-900">
              Reset access
              <br />
              in minutes.
            </h1>
            <p className="text-sm text-neutral-500">
              We will email a secure code so you can set a new password. If your email is not recognized, contact your
              administration for assistance.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
              <div className="flex items-center gap-2 rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure verification
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(58,154,255,0.12)] px-3 py-1">
                <KeyRound className="h-3.5 w-3.5" />
                One-time code
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-400">Need help? Contact your system administrator.</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center"
        >
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-neutral-900">Forgot password</h2>
              <p className="text-sm text-neutral-500">
                {step === 'request'
                  ? 'Enter your email to receive a verification code.'
                  : step === 'verify'
                  ? 'Enter the 6-digit code from your email.'
                  : step === 'reset'
                  ? 'Set a new password for your account.'
                  : 'You can now sign in with your new password.'}
              </p>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>
                  {step === 'request'
                    ? 'Send reset code'
                    : step === 'verify'
                    ? 'Verify code'
                    : step === 'reset'
                    ? 'Choose new password'
                    : 'Password updated'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {step === 'request' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@school.edu"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="button" className="w-full" disabled={loading || !email} onClick={requestCode}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending code...
                        </span>
                      ) : (
                        'Send code'
                      )}
                    </Button>
                  </>
                )}

                {step === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reset-code">Verification code</Label>
                      <Input
                        id="reset-code"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                      />
                    </div>
                    <Button type="button" className="w-full" disabled={loading || code.length < 4} onClick={verifyCode}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                        </span>
                      ) : (
                        'Verify code'
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="w-full text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Use a different email
                    </button>
                  </>
                )}

                {step === 'reset' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Create a new password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                      />
                    </div>
                    <Button type="button" className="w-full" disabled={loading} onClick={confirmReset}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                        </span>
                      ) : (
                        'Update password'
                      )}
                    </Button>
                  </>
                )}

                {step === 'done' && (
                  <div className="space-y-3 text-sm text-neutral-600">
                    <div>Your password has been updated successfully.</div>
                    <Button as="a" href="/login" className="w-full">
                      Back to sign in
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-xs text-neutral-500">
              Remembered your password?{' '}
              <Link href="/login" className="font-medium text-[var(--brand-blue-deep)] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
