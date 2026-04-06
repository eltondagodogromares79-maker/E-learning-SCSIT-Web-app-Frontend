import type { Department } from '@/types';

export const mockDepartments: Department[] = [
  {
    id: 'dep-01',
    name: 'Mathematics',
    code: 'MATH',
    description: 'STEM-focused courses and research.',
    school_level_id: 'level-01',
    principal_or_dean_id: 'principal-01',
    created_at: '2020-06-01T08:00:00Z',
    updated_at: '2025-02-01T08:00:00Z',
  },
  {
    id: 'dep-02',
    name: 'English',
    code: 'ENG',
    description: 'Communication, writing, and literature.',
    school_level_id: 'level-01',
    principal_or_dean_id: 'principal-01',
    created_at: '2020-06-01T08:00:00Z',
    updated_at: '2025-02-01T08:00:00Z',
  },
  {
    id: 'dep-03',
    name: 'Science',
    code: 'SCI',
    description: 'Lab-based learning and experiments.',
    school_level_id: 'level-01',
    principal_or_dean_id: 'principal-01',
    created_at: '2020-06-01T08:00:00Z',
    updated_at: '2025-02-01T08:00:00Z',
  },
];
