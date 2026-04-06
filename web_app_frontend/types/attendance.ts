export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: string;
  section: string;
  section_name?: string;
  section_subject?: string | null;
  section_subject_id?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  announcement?: string | null;
  title?: string | null;
  scheduled_at: string;
  is_online_class?: boolean;
  is_live?: boolean;
  provider?: string | null;
  room_key?: string | null;
  join_url?: string | null;
  ended_at?: string | null;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  excused_count?: number;
  total_count?: number;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  my_status?: AttendanceStatus | null;
}

export interface AttendanceRecord {
  id: string;
  session: string;
  student: string;
  student_name?: string;
  student_number?: string;
  status: AttendanceStatus;
  note?: string | null;
  marked_by?: string | null;
  marked_at?: string | null;
}

export interface AttendanceSummary {
  student_id: string;
  student_name?: string;
  student_number?: string | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  completion: number;
}
