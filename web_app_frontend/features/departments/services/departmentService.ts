import { api } from '@/lib/api';
import type { Department } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiDepartment {
  id: string;
  name: string;
  school_level?: string | null;
  school_level_name?: string | null;
  created_at: string;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapDepartment(department: ApiDepartment): Department {
  return {
    id: department.id,
    name: department.name,
    code: department.school_level_name ?? '',
    school_level_id: department.school_level ?? '',
    created_at: department.created_at,
    updated_at: department.created_at,
  };
}

export const departmentService = {
  async list(): Promise<Department[]> {
    const { data } = await api.get<ApiList<ApiDepartment>>('/api/departments/');
    return unwrapList(data).map(mapDepartment);
  },
};
