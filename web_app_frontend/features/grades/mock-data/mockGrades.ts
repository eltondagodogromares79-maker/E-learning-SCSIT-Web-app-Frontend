import type { StudentGrade } from '@/types';

export const mockGrades: StudentGrade[] = [
  {
    id: 'grade-1',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_id: '7e1c76d7-2d14-4d2f-8c89-28a1e419e7ef',
    grading_period: '2nd',
    grade: 91,
    remarks: 'Excellent progress',
    created_at: '2025-02-15T08:00:00Z',
    updated_at: '2025-02-16T08:00:00Z',
  },
  {
    id: 'grade-2',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_id: '8a9f6a5d-ff2e-4f7c-88a1-4f99e6b3a940',
    grading_period: '2nd',
    grade: 88,
    remarks: 'Good writing clarity',
    created_at: '2025-02-15T08:00:00Z',
    updated_at: '2025-02-16T08:00:00Z',
  },
  {
    id: 'grade-3',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_id: 'a1e3c9b7-9c20-4a7d-92c9-ef9fb4fa12c1',
    grading_period: '2nd',
    grade: 94,
    remarks: 'Outstanding labs',
    created_at: '2025-02-15T08:00:00Z',
    updated_at: '2025-02-16T08:00:00Z',
  },
];
