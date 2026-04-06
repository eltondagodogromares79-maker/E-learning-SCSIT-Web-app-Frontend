import { api } from '@/lib/api';
import type { DashboardStat, StudentPerformanceResponse, StudentPerformanceDetail } from '@/features/dashboard/types';

export const dashboardService = {
  async student(): Promise<DashboardStat[]> {
    const { data } = await api.get<DashboardStat[]>('/api/dashboard/stats/');
    return data;
  },
  async teacher(): Promise<DashboardStat[]> {
    const { data } = await api.get<DashboardStat[]>('/api/dashboard/stats/');
    return data;
  },
  async principal(): Promise<DashboardStat[]> {
    const { data } = await api.get<DashboardStat[]>('/api/dashboard/stats/');
    return data;
  },
  async admin(): Promise<DashboardStat[]> {
    const { data } = await api.get<DashboardStat[]>('/api/dashboard/stats/');
    return data;
  },
  async dean(): Promise<DashboardStat[]> {
    const { data } = await api.get<DashboardStat[]>('/api/dashboard/stats/');
    return data;
  },
  async studentPerformance(): Promise<StudentPerformanceResponse> {
    const { data } = await api.get<StudentPerformanceResponse>('/api/dashboard/student-performance/');
    return data;
  },
  async studentPerformanceDetail(studentId: string): Promise<StudentPerformanceDetail> {
    const { data } = await api.get<StudentPerformanceDetail>(`/api/dashboard/student-performance/${studentId}/`);
    return data;
  },
};
