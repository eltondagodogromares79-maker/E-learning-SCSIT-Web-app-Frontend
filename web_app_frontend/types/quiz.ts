export interface Quiz {
  id: string;
  section_subject_id: string;
  section_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  description?: string;
  total_points: number;
  time_limit_minutes?: number;
  attempt_limit: number;
  due_date?: string;
  created_at: string;
  questions?: Question[];
  ai_grade_on_submit?: boolean;
  security_level?: 'normal' | 'strict';
  is_available?: boolean;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'identification';

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  choices?: Choice[];
}

export interface Choice {
  id: string;
  choice_text: string;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title?: string;
  section_subject_id?: string;
  student_id: string;
  student_name?: string;
  score: number;
  raw_score?: number;
  penalty_percent?: number;
  feedback?: string;
  ai_grade_applied?: boolean;
  ai_grade_failed?: boolean;
  answers?: QuizAnswer[];
  started_at: string;
  submitted_at?: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  selected_choice_id?: string;
  selected_choice_text?: string;
  selected_choice_is_correct?: boolean;
  text_answer?: string;
  points_earned?: number;
  is_correct?: boolean;
  feedback?: string;
  question_text?: string;
  question_points?: number;
  question_type?: string;
}

export interface QuizProctorSession {
  session_id: string;
  warnings: number;
  terminations: number;
  penalty_percent: number;
  status: string;
}

export interface QuizProctorLog {
  id: string;
  student_id: string;
  student_name: string;
  attempt_id?: string | null;
  status: string;
  warnings: number;
  terminations: number;
  penalty_percent: number;
  started_at: string;
  ended_at?: string | null;
  events: Array<{ id: string; type: string; detail?: string | null; created_at: string }>;
  snapshots: Array<{ id: string; image_url: string; reason?: string | null; created_at: string }>;
}

export interface QuizProctorSummary {
  quiz_id: string;
  quiz_title: string;
  total_sessions: number;
  total_warnings: number;
  total_terminations: number;
  total_snapshots: number;
}
