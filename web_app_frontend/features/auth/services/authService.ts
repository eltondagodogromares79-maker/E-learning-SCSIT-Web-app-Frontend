import { api } from '@/lib/api';
import { tokenStorage } from '@/lib/tokenStorage';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: User;
  detail?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export type UpdateProfilePayload = Partial<Pick<
  User,
  | 'first_name'
  | 'last_name'
  | 'middle_name'
  | 'phone_number'
  | 'address'
  | 'date_of_birth'
  | 'profile_picture'
>>;

function normalizeUser(user?: User): User | undefined {
  if (!user) return undefined;
  return { ...user };
}

export const authService = {
  async login(payload: LoginPayload) {
    const response = await api.post<LoginResponse>('/api/users/login/', payload);
    const data = response.data ?? {};
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return { ...data, user: normalizeUser(data.user) };
  },
  async logout() {
    await api.post('/api/users/logout/');
    tokenStorage.clear();
  },
  async me() {
    const response = await api.get<User>('/api/users/profile/');
    return normalizeUser(response.data) as User;
  },
  async updateProfile(payload: UpdateProfilePayload | FormData) {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await api.patch<User>(
      '/api/users/update_profile/',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return normalizeUser(response.data) as User;
  },
  async changePassword(payload: ChangePasswordPayload) {
    await api.post('/api/users/change_password/', payload);
  },
};
