import { api } from '@/lib/api';

export interface PublicTeacher {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  sections?: Array<{ id: string; name: string }>;
}

export interface PublicTeacherResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicTeacher[];
}

export const publicTeacherService = {
  async list(params?: { search?: string; page?: number; role?: string }): Promise<PublicTeacherResponse> {
    const { data } = await api.get<PublicTeacherResponse>('/api/users/public-staff/', { params });
    return data;
  },
};
