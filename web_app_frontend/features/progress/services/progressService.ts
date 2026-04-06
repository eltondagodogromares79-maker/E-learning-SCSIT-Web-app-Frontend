import { api } from '@/lib/api';
import type { ProgressSnapshot } from '@/features/progress/types';

export const progressService = {
  async get(): Promise<ProgressSnapshot> {
    const { data } = await api.get<ProgressSnapshot>('/api/dashboard/progress/');
    return data;
  },
};
