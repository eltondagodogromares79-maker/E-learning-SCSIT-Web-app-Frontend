import { api } from '@/lib/api';
import type { StudentGrade } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiGrade {
  id: string;
  student: string;
  subject_code: string;
  final_score: number;
  grade: string;
  remarks?: string | null;
  school_year?: string | null;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapGrade(grade: ApiGrade): StudentGrade {
  return {
    id: grade.id,
    student_id: grade.student,
    subject_code: grade.subject_code,
    final_score: grade.final_score,
    grade: grade.grade,
    remarks: grade.remarks ?? undefined,
    school_year: grade.school_year ?? undefined,
  };
}

export const gradeService = {
  async list(): Promise<StudentGrade[]> {
    const { data } = await api.get<ApiList<ApiGrade>>('/api/subjects/grades/');
    return unwrapList(data).map(mapGrade);
  },
};
