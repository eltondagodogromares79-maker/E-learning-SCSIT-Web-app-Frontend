import { useQuery } from '@tanstack/react-query';
import { departmentService } from '@/features/departments/services/departmentService';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });
}
