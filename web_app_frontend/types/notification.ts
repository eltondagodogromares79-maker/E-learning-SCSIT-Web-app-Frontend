export type NotificationKind =
  | 'lesson'
  | 'assignment'
  | 'quiz'
  | 'assignment_submission'
  | 'quiz_submission'
  | 'attendance';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  target_id: string;
  section_subject_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}
