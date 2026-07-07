import { request } from './apiClient';

export function searchCourses(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return request(`/api/courses/search${query ? `?${query}` : ''}`);
}
