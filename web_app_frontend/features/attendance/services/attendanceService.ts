import { api } from '@/lib/api';
import type { AttendanceSession, AttendanceRecord, AttendanceStatus, AttendanceSummary } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiAttendanceSession extends AttendanceSession {}
interface ApiAttendanceRecord extends AttendanceRecord {}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const attendanceService = {
  async listSessions(params?: { section_subject?: string; section?: string }): Promise<AttendanceSession[]> {
    const { data } = await api.get<ApiList<ApiAttendanceSession>>('/api/attendance/sessions/', { params });
    return unwrapList(data);
  },
  async getSession(sessionId: string): Promise<AttendanceSession> {
    const { data } = await api.get<ApiAttendanceSession>(`/api/attendance/sessions/${sessionId}/`);
    return data;
  },
  async createSession(payload: {
    section_subject?: string;
    section?: string;
    title?: string;
    scheduled_at: string;
    is_online_class?: boolean;
  }): Promise<AttendanceSession> {
    const { data } = await api.post<ApiAttendanceSession>('/api/attendance/sessions/', payload);
    return data;
  },
  async updateSession(
    sessionId: string,
    payload: Partial<{
      title: string;
      scheduled_at: string;
      is_online_class: boolean;
      section_subject: string | null;
      section: string;
    }>
  ): Promise<AttendanceSession> {
    const { data } = await api.patch<ApiAttendanceSession>(`/api/attendance/sessions/${sessionId}/`, payload);
    return data;
  },
  async deleteSession(sessionId: string) {
    await api.delete(`/api/attendance/sessions/${sessionId}/`);
  },
  async joinSession(sessionId: string): Promise<{ join_url?: string | null; status?: string | null }> {
    const { data } = await api.post(`/api/attendance/sessions/${sessionId}/join/`);
    return data;
  },
  async startSession(sessionId: string): Promise<{ join_url?: string | null; is_live?: boolean }> {
    const { data } = await api.post(`/api/attendance/sessions/${sessionId}/start/`);
    return data;
  },
  async endSession(sessionId: string): Promise<{ ended_at?: string | null }> {
    const { data } = await api.post(`/api/attendance/sessions/${sessionId}/end/`);
    return data;
  },
  async listRecords(sessionId: string): Promise<AttendanceRecord[]> {
    const { data } = await api.get<ApiAttendanceRecord[]>(`/api/attendance/sessions/${sessionId}/records/`);
    return data;
  },
  async listSummary(params?: { section_subject?: string; section?: string }): Promise<AttendanceSummary[]> {
    const { data } = await api.get<AttendanceSummary[]>('/api/attendance/sessions/summary/', { params });
    return data ?? [];
  },
  async markRecords(sessionId: string, records: Array<{ id: string; status: AttendanceStatus; note?: string }>) {
    const { data } = await api.post<ApiAttendanceRecord[]>(`/api/attendance/sessions/${sessionId}/mark/`, { records });
    return data;
  },
};
