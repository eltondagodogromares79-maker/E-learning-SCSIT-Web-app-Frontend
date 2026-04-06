import type { StudentGrade } from '@/types';

export const mockGrades: StudentGrade[] = [
  {
    id: 'grade-1',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_code: 'MATH-201',
    grade: '91',
    final_score: 91,
    remarks: 'Excellent progress',
    school_year: '2024-2025',
  },
  {
    id: 'grade-2',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_code: 'ENG-102',
    grade: '88',
    final_score: 88,
    remarks: 'Good writing clarity',
    school_year: '2024-2025',
  },
  {
    id: 'grade-3',
    student_id: 'b0a1f1c2-6f6b-4d2a-9f50-7a5cfad2c901',
    subject_code: 'CHEM-110',
    grade: '94',
    final_score: 94,
    remarks: 'Outstanding labs',
    school_year: '2024-2025',
  },
];
