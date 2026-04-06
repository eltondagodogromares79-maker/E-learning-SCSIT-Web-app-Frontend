import type { Section } from '@/types';

export const mockSections: Section[] = [
  {
    id: 'sec-10A',
    name: 'Grade 10 - A',
    grade_level_id: 'grade-10',
    program_or_course_id: 'prog-01',
    adviser_id: 'e7b3e2b7-fd07-4dfb-9f0b-1a81c2a10b2b',
    school_year: '2024-2025',
    max_students: 40,
    description: 'STEM track section',
    created_at: '2024-05-01T08:00:00Z',
  },
  {
    id: 'sec-10B',
    name: 'Grade 10 - B',
    grade_level_id: 'grade-10',
    program_or_course_id: 'prog-01',
    adviser_id: 'f2d1b3c9-2ff6-4c9b-8c21-4da45e8a2310',
    school_year: '2024-2025',
    max_students: 38,
    description: 'Humanities track section',
    created_at: '2024-05-01T08:00:00Z',
  },
];
