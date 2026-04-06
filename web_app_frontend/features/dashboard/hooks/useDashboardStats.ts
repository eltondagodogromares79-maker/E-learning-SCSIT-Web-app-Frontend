import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

export function useStudentStats() {
  return useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => dashboardService.student(),
  });
}

export function useTeacherStats() {
  return useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => dashboardService.teacher(),
  });
}

export function usePrincipalStats() {
  return useQuery({
    queryKey: ['dashboard', 'principal'],
    queryFn: () => dashboardService.principal(),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardService.admin(),
  });
}

export function useDeanStats() {
  return useQuery({
    queryKey: ['dashboard', 'dean'],
    queryFn: () => dashboardService.dean(),
  });
}
