'use client';

import AppShell from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { studentNav } from '@/components/navigation/nav-config';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ChangePassword from '@/features/auth/components/ChangePassword';

export default function ProfilePage() {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  const [openPassword, setOpenPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const profileSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    middle_name: z.string().optional(),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    date_of_birth: z.string().optional(),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      middle_name: user?.middle_name ?? '',
      phone_number: user?.phone_number ?? '',
      address: user?.address ?? '',
      date_of_birth: user?.date_of_birth ?? '',
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      middle_name: user.middle_name ?? '',
      phone_number: user.phone_number ?? '',
      address: user.address ?? '',
      date_of_birth: user.date_of_birth ?? '',
    });
    setAvatarPreview(user.profile_picture ?? '');
  }, [reset, user]);

  const onSubmit = async (data: ProfileFormData) => {
    clearError();
    try {
      const payload: Partial<ProfileFormData> = {};
      (Object.keys(data) as Array<keyof ProfileFormData>).forEach((key) => {
        const currentValue = data[key] ?? '';
        const originalValue = (user?.[key] ?? '') as string;
        if (currentValue !== originalValue) {
          payload[key] = data[key];
        }
      });

      if (Object.keys(payload).length === 0 && !avatarFile) {
        return;
      }

      let updated;
      if (avatarFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value as string);
          }
        });
        formData.append('profile_picture', avatarFile);
        updated = await updateProfile(formData);
      } else {
        updated = await updateProfile(payload);
      }
      reset({
        first_name: updated.first_name ?? '',
        last_name: updated.last_name ?? '',
        middle_name: updated.middle_name ?? '',
        phone_number: updated.phone_number ?? '',
        address: updated.address ?? '',
        date_of_birth: updated.date_of_birth ?? '',
      });
      setAvatarFile(null);
      setAvatarPreview(updated.profile_picture ?? '');
    } catch {
      // handled in context
    }
  };

  return (
    <AppShell title="Profile" subtitle="Your account details" navItems={studentNav}>
      <div className="space-y-6">
        <PageHeader title="Profile" description="Manage your personal information and account details." />

        <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error ? (
                  <div className="rounded-lg border border-[rgba(17,17,17,0.12)] bg-[var(--brand-gold-muted)] p-3 text-xs text-[#111111]">
                    {error}
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Profile picture</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-full border" style={{ borderColor: 'var(--border)' }}>
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--surface-2)] text-xs text-neutral-400">
                            No photo
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setAvatarFile(file);
                          if (file) {
                            const previewUrl = URL.createObjectURL(file);
                            setAvatarPreview(previewUrl);
                          }
                        }}
                        className="text-xs text-neutral-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input {...register('first_name')} />
                    {errors.first_name ? <p className="text-xs text-neutral-500">{errors.first_name.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input {...register('last_name')} />
                    {errors.last_name ? <p className="text-xs text-neutral-500">{errors.last_name.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Middle name</Label>
                    <Input {...register('middle_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email ?? ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={user?.role ?? ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input {...register('phone_number')} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input {...register('address')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input type="date" {...register('date_of_birth')} />
                  </div>
                </div>
                <Button size="sm" variant="secondary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge>{user?.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Staff access</span>
                  <Badge variant="outline">{user?.is_staff ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date joined</span>
                  <span>{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-'}</span>
                </div>
              </CardContent>
            </Card>

            {user?.student ? (
              <Card>
                <CardHeader>
                  <CardTitle>Student details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-600">
                  <div className="flex items-center justify-between">
                    <span>Student number</span>
                    <span>{user.student.student_number ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admission date</span>
                    <span>{user.student.admission_date ? new Date(user.student.admission_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">Enrollments</div>
                  <div className="space-y-2">
                    {(user.student.enrollments ?? []).length === 0 ? (
                      <div className="text-xs text-neutral-500">No enrollments found.</div>
                    ) : (
                      user.student.enrollments?.map((enrollment) => (
                        <div key={enrollment.id} className="rounded-lg border border-[rgba(17,17,17,0.12)] bg-[var(--surface-2)] p-3">
                          <div className="text-sm font-medium text-neutral-900">
                            {enrollment.section ?? 'No section'} • {enrollment.year_level ?? '—'}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {enrollment.program ?? '—'} • {enrollment.term ?? '—'} • {enrollment.school_year ?? '—'}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Status: {enrollment.status ?? '—'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline" onClick={() => setOpenPassword(true)}>Change password</Button>
                <Button className="w-full" variant="outline">Notification settings</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={openPassword} onOpenChange={setOpenPassword}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <ChangePassword />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPassword(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
