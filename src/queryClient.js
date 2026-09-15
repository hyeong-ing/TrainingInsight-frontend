import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  dashboard: ['dashboard'],
  incompleteTrainings: ['trainings', 'incomplete'],
  employeeTrainingStatuses: ['employees', 'training-status'],
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
    },
  },
});
