export interface Assignment {
  id: string;
  section_subject_id: string;
  section_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string;
  total_points: number;
  due_date: string;
  allow_late_submission: boolean;
  created_by_name?: string;
  created_at: string;
}

export type SubmissionStatus = 'submitted' | 'graded' | 'late';

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  student_id: string;
  student_name?: string;
  submission_file?: string;
  submission_text?: string;
  submission_url?: string;
  status?: SubmissionStatus;
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
}
