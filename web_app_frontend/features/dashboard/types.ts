export interface DashboardStat {
  label: string;
  value: string;
  trend?: string;
}

export interface StudentPerformanceSubject {
  section_subject_id: string;
  subject_name: string;
  teacher_name?: string | null;
  assignment_average?: number | null;
  quiz_average?: number | null;
  missing_assignments?: number;
  missing_quizzes?: number;
  violations?: number;
}

export interface StudentPerformanceStudent {
  student_id: string;
  student_name: string;
  student_number?: string | null;
  gender?: string | null;
  assignments?: { missing: number; submitted: number; total: number; average_score: number | null };
  quizzes?: { missing: number; attempted: number; total: number; average_score: number | null };
  attendance: { present: number; absent: number; late: number; excused: number; total: number };
  violations?: number;
  subjects?: StudentPerformanceSubject[];
}

export interface StudentPerformanceSection {
  section_id: string;
  section_name: string;
  section_subject_id?: string;
  subject_name?: string;
  teacher_name?: string | null;
  students: StudentPerformanceStudent[];
}

export interface StudentPerformanceResponse {
  mode: 'teacher' | 'adviser' | string;
  sections: StudentPerformanceSection[];
}

export interface StudentPerformanceDetail {
  student_id: string;
  student_name: string;
  student_number?: string | null;
  gender?: string | null;
  section_id?: string | null;
  section_name?: string | null;
  attendance: { present: number; absent: number; late: number; excused: number; total: number };
  subjects: Array<{
    section_subject_id: string;
    subject_name: string;
    teacher_name?: string | null;
    assignments_score: number;
    assignments_total: number;
    quizzes_score: number;
    quizzes_total: number;
    missing_assignments: number;
    missing_quizzes: number;
    violations: number;
  }>;
}
