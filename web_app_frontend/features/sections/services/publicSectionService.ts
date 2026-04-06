import { api } from '@/lib/api';

export interface PublicSection {
  id: string;
  name: string;
  adviser_name?: string | null;
  school_year_name?: string | null;
}

export interface PublicSectionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicSection[];
}

export const publicSectionService = {
  async list(params?: { search?: string; page?: number }): Promise<PublicSectionResponse> {
    const { data } = await api.get<PublicSectionResponse>('/api/sections/public/', { params });
    return data;
  },
};
