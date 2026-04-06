import { api } from '@/lib/api';
import type { Section } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiSection {
  id: string;
  name: string;
  year_level?: string | null;
  school_year?: string | null;
  adviser?: string | null;
  capacity?: number | null;
  created_at: string;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapSection(section: ApiSection): Section {
  return {
    id: section.id,
    name: section.name,
    grade_level_id: section.year_level ?? '',
    program_or_course_id: undefined,
    adviser_id: section.adviser ?? undefined,
    school_year: section.school_year ?? '',
    max_students: section.capacity ?? 0,
    created_at: section.created_at,
  };
}

export const sectionService = {
  async list(): Promise<Section[]> {
    const { data } = await api.get<ApiList<ApiSection>>('/api/sections/');
    return unwrapList(data).map(mapSection);
  },
};
