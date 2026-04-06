import { api } from '@/lib/api';
import type { StudentSummary, TranscriptEnrollment } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiStudent {
  id: string;
  user: string;
  user_name: string;
  student_number?: string | null;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapStudent(student: ApiStudent): StudentSummary {
  return {
    id: student.id,
    user_id: student.user,
    user_name: student.user_name,
    student_number: student.student_number ?? undefined,
  };
}

export const studentService = {
  async list(): Promise<StudentSummary[]> {
    const { data } = await api.get<ApiList<ApiStudent>>('/api/users/students/');
    return unwrapList(data).map(mapStudent);
  },
  async transcript(): Promise<TranscriptEnrollment[]> {
    const { data } = await api.get<TranscriptEnrollment[]>('/api/sections/enrollments/transcript/');
    return data;
  },
};
