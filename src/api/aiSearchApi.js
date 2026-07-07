import { request } from './apiClient';

export function searchCoursesWithAi(query) {
  return request('/api/ai/course-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
