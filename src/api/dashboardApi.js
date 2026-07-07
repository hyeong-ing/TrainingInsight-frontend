import { request } from './apiClient';

export function fetchDashboard() {
  return request('/api/dashboard');
}
