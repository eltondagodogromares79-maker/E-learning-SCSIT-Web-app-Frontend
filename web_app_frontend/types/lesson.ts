export type LessonContentType = 'pdf' | 'image' | 'text' | 'link' | 'video';

export interface Lesson {
  id: string;
  section_subject_id: string;
  section_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  title: string;
  description?: string;
  content_type: LessonContentType;
  file_url?: string;
  created_at: string;
}
