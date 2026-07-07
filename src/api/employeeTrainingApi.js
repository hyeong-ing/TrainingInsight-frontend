import { request } from './apiClient';

export function fetchEmployeeTrainingStatuses() {
  return request('/api/employees/training-status');
}

export function updateTrainingCompletion({ employeeId, courseId, completed }) {
  return request('/api/training-records/completion', {
    method: 'PATCH',
    body: JSON.stringify({ employeeId, courseId, completed }),
  });
}
