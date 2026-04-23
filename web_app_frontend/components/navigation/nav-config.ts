export type NavIconName =
  | 'LayoutGrid'
  | 'BookOpen'
  | 'BookCopy'
  | 'ClipboardList'
  | 'ClipboardCheck'
  | 'ChartBar'
  | 'GraduationCap'
  | 'Users'
  | 'Settings'
  | 'Layers'
  | 'FileText'
  | 'School'
  | 'Video';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
}

export const studentNav: NavItem[] = [
  { label: 'Home', href: '/dashboard/student', icon: 'LayoutGrid' },
  { label: 'Learning Materials', href: '/dashboard/student/lessons', icon: 'BookCopy' },
  { label: 'Assignments', href: '/dashboard/student/assignments', icon: 'ClipboardList' },
  { label: 'Quizzes', href: '/dashboard/student/quizzes', icon: 'ClipboardCheck' },
  { label: 'Live Classes', href: '/dashboard/student/online-classes', icon: 'Video' },
  { label: 'School Records', href: '/dashboard/student/transcript', icon: 'FileText' },
];

export const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/teacher', icon: 'LayoutGrid' },
  { label: 'My Section', href: '/dashboard/teacher/adviser', icon: 'School' },
  { label: 'Online Classes', href: '/dashboard/teacher/online-classes', icon: 'Video' },
  { label: 'Learning Materials', href: '/dashboard/teacher/lessons', icon: 'BookCopy' },
  { label: 'Assignments', href: '/dashboard/teacher/assignments', icon: 'FileText' },
  { label: 'Quizzes', href: '/dashboard/teacher/quizzes', icon: 'ClipboardCheck' },
  { label: 'Proctoring', href: '/dashboard/teacher/proctoring', icon: 'ClipboardCheck' },
];
