export interface SchoolLevel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  school_level_id: string;
  principal_or_dean_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GradeLevel {
  id: string;
  name: string;
  level_number: number;
  department_id: string;
  description?: string;
  created_at: string;
}

export interface ProgramOrStrand {
  id: string;
  code: string;
  name: string;
  department_id: string;
  duration_years: number;
  description?: string;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  grade_level_id: string;
  program_or_course_id?: string;
  adviser_id?: string;
  school_year: string;
  max_students: number;
  description?: string;
  created_at: string;
}

export type EnrollmentStatus = 'active' | 'dropped' | 'completed';

export interface Enrollment {
  id: string;
  student_id: string;
  section_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  dropped_at?: string;
  completed_at?: string;
}
