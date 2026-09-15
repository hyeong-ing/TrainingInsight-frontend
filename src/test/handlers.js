import { http, HttpResponse } from 'msw';
import {
  aiSearchFixture,
  cloneFixture,
  dashboardFixture,
  employeeTrainingFixture,
  incompleteFixture,
} from './fixtures.js';

export const handlers = [
  http.get('/api/dashboard', () => HttpResponse.json(cloneFixture(dashboardFixture))),
  http.get('/api/trainings/incomplete', () => HttpResponse.json(cloneFixture(incompleteFixture))),
  http.get('/api/employees/training-status', () => HttpResponse.json(cloneFixture(employeeTrainingFixture))),
  http.patch('/api/training-records/completion', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/ai/course-search', () => HttpResponse.json(cloneFixture(aiSearchFixture))),
];
