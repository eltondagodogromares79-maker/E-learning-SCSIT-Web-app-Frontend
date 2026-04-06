'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type UpdateProfilePayload, type ChangePasswordPayload } from '@/features/auth/services/authService';
import { tokenStorage } from '@/lib/tokenStorage';
import type { User } from '@/types';
import { useToast } from '@/components/ui/toast';

export function useAuth() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const userQuery = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    retry: 0,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login({ email, password }),
    onSuccess: async (data) => {
      try {
        const profile = await authService.me();
        queryClient.setQueryData(['auth', 'me'], profile);
        showToast({ title: 'Welcome back', description: `Signed in as ${profile.email}`, variant: 'success' });
      } catch {
        if (data?.user) {
          queryClient.setQueryData(['auth', 'me'], data.user);
          showToast({ title: 'Welcome back', description: `Signed in as ${data.user.email}`, variant: 'success' });
        } else {
          showToast({ title: 'Signed in', description: 'Login successful.', variant: 'success' });
        }
      }
    },
    onError: (err: unknown) => {
      let message = 'Email or password is incorrect. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { detail?: string; error?: string } } }).response;
        message = response?.data?.detail ?? response?.data?.error ?? message;
      }
      showToast({ title: 'Sign in failed', description: message, variant: 'error' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      tokenStorage.clear();
      showToast({ title: 'Signed out', description: 'You have been logged out.', variant: 'info' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to sign out.';
      showToast({ title: 'Sign out failed', description: message, variant: 'error' });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload | FormData) => authService.updateProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated);
      showToast({ title: 'Profile updated', description: 'Your changes have been saved.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to update profile.';
      showToast({ title: 'Update failed', description: message, variant: 'error' });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
    onSuccess: () => {
      showToast({ title: 'Password changed', description: 'Your password was updated successfully.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to change password.';
      showToast({ title: 'Password change failed', description: message, variant: 'error' });
    },
  });

  const latestError =
    loginMutation.error ||
    updateProfileMutation.error ||
    changePasswordMutation.error ||
    logoutMutation.error ||
    userQuery.error;

  const isLoading =
    userQuery.isLoading ||
    loginMutation.isPending ||
    logoutMutation.isPending ||
    updateProfileMutation.isPending ||
    changePasswordMutation.isPending;

  return {
    user: userQuery.data ?? null,
    isInitializing: userQuery.isLoading,
    error: latestError ? (latestError as Error).message : null,
    clearError: () => undefined,
    login: async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password });
      return result?.user ?? (queryClient.getQueryData(['auth', 'me']) as User | null);
    },
    logout: () => logoutMutation.mutateAsync(),
    updateProfile: (payload: UpdateProfilePayload | FormData) => updateProfileMutation.mutateAsync(payload),
    changePassword: (payload: ChangePasswordPayload) => changePasswordMutation.mutateAsync(payload),
    isLoading,
  };
}
