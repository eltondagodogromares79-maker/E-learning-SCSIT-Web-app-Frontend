import type { Lesson } from './lesson';
import type { Assignment } from './assignment';
import type { Quiz } from './quiz';

export interface Subject {
  id: string;
  name: string;
  code: string;
  program_id: string;
  year_level_id: string;
  instructor_id?: string;
  instructor_name?: string;
  units: number;
  description?: string;
  created_at: string;
}

export interface SectionSubject {
  id: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  term_id: string;
  term_label?: string;
  teacher_name?: string;
}

export interface SubjectContentResponse {
  subject: Subject;
  lessons: Lesson[];
  assignments: Assignment[];
  quizzes: Quiz[];
}
