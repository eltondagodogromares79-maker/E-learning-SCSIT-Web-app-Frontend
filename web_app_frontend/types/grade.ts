export interface StudentGrade {
  id: string;
  student_id: string;
  subject_code: string;
  grade: string;
  final_score: number;
  remarks?: string;
  school_year?: string;
}
