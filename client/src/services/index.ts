import api from './api';
import { QuizStartResponse, SubmitResult, AssessmentHistory, AssessmentReport } from '../types';

export const authApi = {
  login: (employee_no: string, password: string) =>
    api.post('/auth/login', { employee_no, password }),
  getCaptcha: () =>
    api.get<{ data: { captcha_id: string; svg: string } }>('/auth/captcha'),
  register: (employee_no: string, name: string, department: string, password: string, captcha_id: string, captcha_text: string) =>
    api.post('/auth/register', { employee_no, name, department, password, captcha_id, captcha_text }),
  changePassword: (old_password: string, new_password: string) =>
    api.put('/auth/password', { old_password, new_password }),
};

export const quizApi = {
  getQuestions: () =>
    api.get<{ data: QuizStartResponse }>('/quiz/questions'),
  submit: (assessment_id: number, answers: Record<string, string>) =>
    api.post<{ data: SubmitResult }>('/quiz/submit', { assessment_id, answers }),
};

export const assessmentApi = {
  getHistory: () =>
    api.get<{ data: AssessmentHistory[] }>('/assessments/history'),
  getReport: (id: number) =>
    api.get<{ data: AssessmentReport }>(`/assessments/${id}/report`),
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getEmployees: (params?: { page?: number; page_size?: number; department?: string; rating?: string }) =>
    api.get('/admin/employees', { params }),
  getEmployeeAssessments: (id: number) =>
    api.get(`/admin/employees/${id}/assessments`),
  listQuestions: (params?: { dimension?: string; page?: number; page_size?: number }) =>
    api.get('/admin/questions', { params }),
  createQuestion: (data: any) => api.post('/admin/questions', data),
  importQuestions: (markdown: string) => api.post('/admin/questions/import', { markdown }),
  updateQuestion: (id: number, data: any) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`),
  toggleQuestionStatus: (id: number) => api.patch(`/admin/questions/${id}/status`),
  createUser: (data: any) => api.post('/admin/users', data),
  listUsers: (params?: { page?: number; page_size?: number }) =>
    api.get('/admin/users', { params }),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id: number) => api.patch(`/admin/users/${id}/status`),
  resetPassword: (id: number, new_password: string) =>
    api.post(`/admin/users/${id}/reset-password`, { new_password }),
};
