import { api } from '@/lib/api';

export interface PublicStats {
  teachers: number;
  students: number;
  subjects: number;
}

export const publicStatsService = {
  async get(): Promise<PublicStats> {
    const { data } = await api.get<PublicStats>('/api/dashboard/public-stats/');
    return data;
  },
};
