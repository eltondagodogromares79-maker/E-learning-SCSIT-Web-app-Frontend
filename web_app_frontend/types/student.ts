export interface StudentSummary {
  id: string;
  user_id: string;
  user_name: string;
  student_number?: string;
}

export interface TranscriptSubject {
  id: string;
  subject_code?: string;
  subject_name?: string;
  teacher_name?: string;
  school_year?: string;
}

export interface TranscriptEnrollment {
  id: string;
  term_label?: string;
  school_year_name?: string;
  status: string;
  is_current: boolean;
  year_level_name?: string;
  program_name?: string;
  enrolled_at: string;
  student_subjects: TranscriptSubject[];
}
