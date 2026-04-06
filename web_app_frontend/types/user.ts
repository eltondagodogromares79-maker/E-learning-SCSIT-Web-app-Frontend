export type UserRole = 'student' | 'teacher' | 'instructor' | 'adviser' | 'principal' | 'dean' | 'admin';

/** Roles that have department-level oversight (high school principal or college dean) */
export type OversightRole = Extract<UserRole, 'principal' | 'dean'>;

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  role: UserRole;
  student_id?: string;
  employee_id?: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: string;
  profile_picture?: string;
  must_change_password?: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  updated_at: string;
  student?: {
    id: string;
    student_number?: string;
    admission_date?: string;
    enrollments?: Array<{
      id: string;
      section?: string | null;
      year_level?: string | null;
      program?: string | null;
      term?: string | null;
      school_year?: string | null;
      status?: string;
      enrolled_at?: string;
    }>;
  };
}
