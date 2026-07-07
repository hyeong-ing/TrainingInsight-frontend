import { request } from './apiClient';

export function fetchIncompleteTrainings() {
  return request('/api/trainings/incomplete');
}
