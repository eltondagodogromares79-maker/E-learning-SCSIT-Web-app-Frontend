import { api } from '@/lib/api';
import type { Assignment, Lesson, Quiz, Subject, SubjectContentResponse, SectionSubject } from '@/types';

type ApiList<T> = T[] | { results: T[] };

interface ApiSubject {
  id: string;
  name: string;
  code: string;
  program: string;
  year_level: string;
  instructor?: string | null;
  instructor_name?: string | null;
  units: number;
  description?: string | null;
  created_at: string;
}

interface ApiLesson {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string | null;
  type: 'pdf' | 'text' | 'link' | 'video';
  file_url?: string | null;
  created_at: string;
}

interface ApiAssignment {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string | null;
  total_points: number;
  due_date: string;
  allow_late_submission: boolean;
  created_at: string;
}

interface ApiQuiz {
  id: string;
  section_subject: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
  title: string;
  description?: string | null;
  total_points: number;
  time_limit_minutes?: number | null;
  attempt_limit: number;
  due_date?: string | null;
  created_at: string;
}

interface ApiSubjectContentResponse {
  subject: ApiSubject;
  lessons: ApiLesson[];
  assignments: ApiAssignment[];
  quizzes: ApiQuiz[];
}

interface ApiSectionSubject {
  id: string;
  section: string;
  section_name: string;
  subject: string;
  subject_name: string;
  term: string;
  term_label?: string | null;
  teacher_name?: string | null;
}

function unwrapList<T>(data: ApiList<T>): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

function mapSubject(subject: ApiSubject): Subject {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    program_id: subject.program,
    year_level_id: subject.year_level,
    instructor_id: subject.instructor ?? undefined,
    instructor_name: subject.instructor_name ?? undefined,
    units: subject.units,
    description: subject.description ?? undefined,
    created_at: subject.created_at,
  };
}

function mapLesson(lesson: ApiLesson): Lesson {
  return {
    id: lesson.id,
    section_subject_id: lesson.section_subject,
    section_id: lesson.section_id,
    subject_id: lesson.subject_id,
    subject_name: lesson.subject_name,
    subject_code: lesson.subject_code,
    title: lesson.title,
    description: lesson.description ?? undefined,
    content_type: lesson.type,
    file_url: lesson.file_url ?? undefined,
    created_at: lesson.created_at,
  };
}

function mapAssignment(assignment: ApiAssignment): Assignment {
  return {
    id: assignment.id,
    section_subject_id: assignment.section_subject,
    section_id: assignment.section_id,
    subject_id: assignment.subject_id,
    subject_name: assignment.subject_name,
    subject_code: assignment.subject_code,
    title: assignment.title,
    description: assignment.description ?? undefined,
    total_points: assignment.total_points,
    due_date: assignment.due_date,
    allow_late_submission: assignment.allow_late_submission,
    created_at: assignment.created_at,
  };
}

function mapQuiz(quiz: ApiQuiz): Quiz {
  return {
    id: quiz.id,
    section_subject_id: quiz.section_subject,
    section_id: quiz.section_id,
    subject_id: quiz.subject_id,
    subject_name: quiz.subject_name,
    title: quiz.title,
    description: quiz.description ?? undefined,
    total_points: quiz.total_points,
    time_limit_minutes: quiz.time_limit_minutes ?? undefined,
    attempt_limit: quiz.attempt_limit,
    due_date: quiz.due_date ?? undefined,
    created_at: quiz.created_at,
  };
}

export const subjectService = {
  async list(): Promise<Subject[]> {
    const { data } = await api.get<ApiList<ApiSubject>>('/api/subjects/');
    return unwrapList(data).map(mapSubject);
  },
  async getContent(subjectId: string): Promise<SubjectContentResponse> {
    const { data } = await api.get<ApiSubjectContentResponse>(`/api/subjects/${subjectId}/content/`);
    return {
      subject: mapSubject(data.subject),
      lessons: data.lessons.map(mapLesson),
      assignments: data.assignments.map(mapAssignment),
      quizzes: data.quizzes.map(mapQuiz),
    };
  },
  async listSectionSubjects(): Promise<SectionSubject[]> {
    const { data } = await api.get<ApiList<ApiSectionSubject>>('/api/subjects/section-subjects/');
    return unwrapList(data).map((item) => ({
      id: item.id,
      section_id: item.section,
      section_name: item.section_name,
      subject_id: item.subject,
      subject_name: item.subject_name,
      term_id: item.term,
      term_label: item.term_label ?? undefined,
      teacher_name: item.teacher_name ?? undefined,
    }));
  },
};
