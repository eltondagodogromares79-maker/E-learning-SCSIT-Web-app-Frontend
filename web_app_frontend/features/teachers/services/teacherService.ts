import { api } from '@/lib/api';
import type { User } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role as User['role'],
    is_active: user.is_active,
    is_staff: false,
    date_joined: user.date_joined,
    updated_at: user.date_joined,
  };
}

export const teacherService = {
  async list(): Promise<User[]> {
    const { data } = await api.get<ApiList<ApiUser>>('/api/users/');
    return unwrapList(data)
      .map(mapUser)
      .filter((user) => user.role === 'instructor' || user.role === 'adviser' || user.role === 'teacher');
  },
};
