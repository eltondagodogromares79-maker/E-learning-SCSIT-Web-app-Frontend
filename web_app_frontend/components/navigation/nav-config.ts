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
  { label: 'Overview', href: '/dashboard/student', icon: 'LayoutGrid' },
  { label: 'Subjects', href: '/dashboard/student/subjects', icon: 'BookOpen' },
  { label: 'Lessons', href: '/dashboard/student/lessons', icon: 'BookCopy' },
  { label: 'Assignments', href: '/dashboard/student/assignments', icon: 'ClipboardList' },
  { label: 'Quizzes', href: '/dashboard/student/quizzes', icon: 'ClipboardCheck' },
  { label: 'Online Classes', href: '/dashboard/student/online-classes', icon: 'Video' },
  { label: 'Attendance', href: '/dashboard/student/attendance', icon: 'ClipboardList' },
  { label: 'Transcript', href: '/dashboard/student/transcript', icon: 'FileText' },
  { label: 'Grades', href: '/dashboard/student/grades', icon: 'ChartBar' },
  { label: 'Progress', href: '/dashboard/student#progress', icon: 'GraduationCap' },
];

export const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard/teacher', icon: 'LayoutGrid' },
  { label: 'My Classes', href: '/dashboard/teacher/classes', icon: 'Users' },
  { label: 'My Section', href: '/dashboard/teacher/adviser', icon: 'School' },
  { label: 'Online Classes', href: '/dashboard/teacher/online-classes', icon: 'Video' },
  { label: 'Attendance', href: '/dashboard/teacher/attendance', icon: 'ClipboardList' },
  { label: 'Lessons', href: '/dashboard/teacher/lessons', icon: 'BookCopy' },
  { label: 'Assignments', href: '/dashboard/teacher/assignments', icon: 'FileText' },
  { label: 'Quizzes', href: '/dashboard/teacher/quizzes', icon: 'ClipboardCheck' },
  { label: 'Proctoring', href: '/dashboard/teacher/proctoring', icon: 'ClipboardCheck' },
  { label: 'Grades', href: '/dashboard/teacher#grades', icon: 'ChartBar' },
];
